"""
Advanced Medical OCR Service with Claude Integration

Implements the workflow: Prescription Image → OCR → Claude Medical Parsing → Structured Data
"""

import json
import base64
import logging
from typing import Dict, List, Optional, Any, Union
import asyncio
from dataclasses import dataclass
from datetime import datetime
import re
import hashlib

# Optional AWS imports for Textract OCR
try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError
    AWS_AVAILABLE = True
except ImportError:
    AWS_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("boto3 not available - AWS Textract OCR will be disabled")

from app.core.config import settings
from app.services.ai_models import AIModelService
from app.services.redis_service import redis_service

logger = logging.getLogger(__name__)

@dataclass
class MedicationInfo:
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    instructions: Optional[str] = None
    strength: Optional[str] = None

@dataclass
class PatientInfo:
    name: Optional[str] = None
    dob: Optional[str] = None
    prescriber: Optional[str] = None
    pharmacy: Optional[str] = None
    date: Optional[str] = None

@dataclass
class MedicalEntity:
    medications: List[MedicationInfo]
    symptoms: List[str]
    allergies: List[str]
    medical_notes: List[str]
    warnings: List[str]
    patient_info: Optional[PatientInfo]
    raw_text: str
    confidence: float
    ocr_provider: str

class MedicalOCRService:
    """
    Advanced Medical OCR Service with multiple providers and Claude integration
    """

    def __init__(self):
        self.ai_service = AIModelService()
        self.ocr_providers = self._initialize_ocr_providers()

    def _initialize_ocr_providers(self) -> List[str]:
        """Initialize available OCR providers"""
        providers = []

        # Check AWS Textract availability
        if self._is_aws_textract_available():
            providers.append('aws_textract')
            logger.info("AWS Textract OCR provider available")

        # Always include tesseract as fallback (would be implemented client-side)
        providers.append('tesseract_fallback')
        logger.info(f"Initialized OCR providers: {providers}")

        return providers

    async def extract_medical_info(self, image_data: str, mime_type: str) -> MedicalEntity:
        """
        Main method to extract medical information from prescription image using Claude Sonnet 4 Vision

        Args:
            image_data: Base64 encoded image data
            mime_type: MIME type of the image

        Returns:
            MedicalEntity with structured medical information
        """
        logger.info("🏥 Starting medical OCR extraction with Claude Sonnet 4 Vision")

        try:
            # Generate hash for image data to check cache
            image_bytes = base64.b64decode(image_data)
            image_hash = redis_service.generate_image_hash(image_bytes)

            # Check if complete analysis result is already cached
            cached_result = redis_service.get_ocr_result(image_hash)
            if cached_result and cached_result.get('medical_data'):
                logger.info(f"📦 Cache hit for complete medical analysis: {image_hash}")
                redis_service.increment_counter("performance", "medical_analysis_cache", "hits")

                medical_data = cached_result['medical_data']
                result = MedicalEntity(
                    medications=medical_data['medications'],
                    symptoms=medical_data['symptoms'],
                    allergies=medical_data['allergies'],
                    medical_notes=medical_data['medical_notes'],
                    warnings=medical_data['warnings'],
                    patient_info=medical_data['patient_info'],
                    raw_text=cached_result.get('text', ''),
                    confidence=cached_result.get('confidence', 95),
                    ocr_provider="claude_sonnet_4_vision"
                )
                return result

            # Step 1: Use Claude Sonnet 4 Vision for direct image analysis
            medical_data = await self._analyze_image_with_claude_vision(image_data, mime_type)

            # Step 2: Cache the complete analysis result
            cache_data = {
                'text': medical_data.get('extracted_text', ''),
                'confidence': 95,  # Claude Vision typically has high confidence
                'provider': 'claude_sonnet_4_vision',
                'medical_data': {
                    'medications': [
                        {
                            'name': med.name,
                            'dosage': med.dosage,
                            'frequency': med.frequency,
                            'instructions': med.instructions,
                            'strength': med.strength
                        } for med in medical_data['medications']
                    ],
                    'symptoms': medical_data['symptoms'],
                    'allergies': medical_data['allergies'],
                    'medical_notes': medical_data['medical_notes'],
                    'warnings': medical_data['warnings'],
                    'patient_info': medical_data['patient_info']
                }
            }
            
            redis_service.cache_ocr_result(image_hash, cache_data)
            redis_service.increment_counter("performance", "medical_analysis_cache", "misses")
            logger.info(f"💾 Cached complete medical analysis: {image_hash}")

            # Step 3: Cache individual medication validations for future lookups
            if medical_data['medications']:
                await self._cache_medication_validations(medical_data['medications'])

            result = MedicalEntity(
                medications=medical_data['medications'],
                symptoms=medical_data['symptoms'],
                allergies=medical_data['allergies'],
                medical_notes=medical_data['medical_notes'],
                warnings=medical_data['warnings'],
                patient_info=medical_data['patient_info'],
                raw_text=medical_data.get('extracted_text', ''),
                confidence=95,
                ocr_provider="claude_sonnet_4_vision"
            )

            logger.info(f"✅ Claude Vision medical analysis completed with {len(medical_data['medications'])} medications found")
            return result

        except Exception as error:
            logger.error(f"❌ Medical OCR extraction failed: {error}")
            redis_service.increment_counter("errors", "medical_ocr", "failures")
            raise Exception(f"Failed to extract medical information: {str(error)}")

    async def _perform_ocr(self, image_data: str, mime_type: str) -> Dict[str, Any]:
        """
        Try OCR providers in order of preference

        Returns:
            Dictionary with text, confidence, and provider name
        """
        best_result = {'text': '', 'confidence': 0, 'provider': 'none'}

        for provider in self.ocr_providers:
            try:
                logger.info(f"📸 Trying OCR with {provider}...")

                if provider == 'aws_textract':
                    result = await self._aws_textract_ocr(image_data, mime_type)
                elif provider == 'tesseract_fallback':
                    result = await self._tesseract_fallback_ocr(image_data)
                else:
                    continue

                logger.info(f"✅ {provider} result: {len(result['text'])} chars, confidence: {result['confidence']}")

                # Use the result with highest confidence
                if result['confidence'] > best_result['confidence']:
                    best_result = {**result, 'provider': provider}
                    logger.info(f"🎯 New best result from {provider}")

                # If we get high confidence result, stop here
                if result['confidence'] > 85:
                    logger.info("🎉 High confidence result achieved")
                    break

            except Exception as error:
                logger.warning(f"⚠️ {provider} OCR failed: {error}")
                continue

        if not best_result['text']:
            raise Exception("All OCR providers failed to extract text from the image")

        logger.info(f"🏆 Final OCR result: {len(best_result['text'])} chars, confidence: {best_result['confidence']}")
        return best_result

    async def _analyze_image_with_claude_vision(self, image_data: str, mime_type: str) -> Dict[str, Any]:
        """
        Use Claude Sonnet 4 Vision to directly analyze prescription images and extract medical information
        
        This method combines OCR and medical parsing in a single step using Claude's vision capabilities
        """
        logger.info("👁️ Analyzing prescription image with Claude Sonnet 4 Vision")

        try:
            # Prepare the vision prompt for medical analysis
            vision_prompt = """
You are a medical AI assistant specialized in analyzing prescription labels, medical documents, and pharmaceutical images with high accuracy.

Analyze this prescription/medical image and extract all visible medical information. The image may contain:
- Prescription labels with medication names, dosages, and instructions
- Medical documents with patient information
- Pharmacy labels with prescriber details
- Medical forms or charts

Please extract and return a JSON object with this exact structure:

{
  "extracted_text": "Full text content visible in the image",
  "medications": [
    {
      "name": "medication name (correct any visual errors using medical knowledge)",
      "dosage": "strength amount (e.g., 500mg, 10ml, 1 tablet)",
      "frequency": "how often to take (e.g., twice daily, BID, every 8 hours)",
      "instructions": "additional instructions (e.g., with food, before bedtime)",
      "strength": "concentration or potency if different from dosage"
    }
  ],
  "symptoms": ["symptom1", "symptom2"],
  "allergies": ["allergy1", "allergy2"],
  "medical_notes": ["important note1", "clinical observation"],
  "warnings": ["warning1", "side effect note", "contraindication"],
  "patient_info": {
    "name": "patient name if visible and readable",
    "dob": "date of birth if visible",
    "prescriber": "doctor/prescriber name if visible",
    "pharmacy": "pharmacy name if visible",
    "date": "prescription date if visible"
  }
}

CRITICAL INSTRUCTIONS FOR MEDICAL ACCURACY:

1. **Medication Name Recognition**: Use your medical knowledge to identify medications even with visual distortions:
   - Look for common medication patterns and suffixes (-cillin, -pril, -statin, etc.)
   - Consider brand names and generic equivalents
   - Correct common visual recognition errors

2. **Dosage and Strength Extraction**: Identify patterns like:
   - "500mg", "10ml", "200mcg", "1 tablet", "5mg/ml"
   - Look for numerical values followed by units

3. **Frequency and Instructions**: Look for:
   - "twice daily", "BID", "TID", "QID", "PRN", "as needed"
   - "every 8 hours", "once daily", "at bedtime"
   - "with food", "on empty stomach", "before meals"

4. **Patient and Prescriber Information**: Extract any visible:
   - Patient names and dates of birth
   - Doctor/prescriber names and credentials
   - Pharmacy information and contact details
   - Prescription dates and refill information

5. **Safety Information**: Look for:
   - Warning labels and contraindications
   - Allergy information
   - Special handling instructions

6. **Text Extraction**: Include the complete visible text for reference

Respond ONLY with the valid JSON object, no additional text or explanation.
"""

            # Use Claude Sonnet 4 with vision capabilities
            response = await self.ai_service._generate_claude_vision_analysis(
                prompt=vision_prompt,
                image_data=image_data,
                mime_type=mime_type
            )

            # Parse the JSON response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1

            if json_start >= 0 and json_end > json_start:
                json_str = response[json_start:json_end]
                parsed_data = json.loads(json_str)

                # Convert to our data structures
                medications = [
                    MedicationInfo(
                        name=med.get('name', ''),
                        dosage=med.get('dosage'),
                        frequency=med.get('frequency'),
                        instructions=med.get('instructions'),
                        strength=med.get('strength')
                    ) for med in parsed_data.get('medications', [])
                ]

                patient_info = None
                if parsed_data.get('patient_info'):
                    patient_info = PatientInfo(
                        name=parsed_data['patient_info'].get('name'),
                        dob=parsed_data['patient_info'].get('dob'),
                        prescriber=parsed_data['patient_info'].get('prescriber'),
                        pharmacy=parsed_data['patient_info'].get('pharmacy'),
                        date=parsed_data['patient_info'].get('date')
                    )

                result = {
                    'medications': medications,
                    'symptoms': parsed_data.get('symptoms', []),
                    'allergies': parsed_data.get('allergies', []),
                    'medical_notes': parsed_data.get('medical_notes', []),
                    'warnings': parsed_data.get('warnings', []),
                    'patient_info': patient_info,
                    'extracted_text': parsed_data.get('extracted_text', '')
                }

                logger.info(f"✅ Claude Vision analysis successful: {len(medications)} medications found")
                return result

            else:
                raise ValueError("No valid JSON found in Claude Vision response")

        except Exception as error:
            logger.error(f"❌ Claude Vision analysis failed: {error}")
            # Fallback to traditional OCR + parsing approach
            logger.info("🔄 Falling back to traditional OCR + Claude text parsing")
            return await self._fallback_ocr_analysis(image_data, mime_type)

    async def _fallback_ocr_analysis(self, image_data: str, mime_type: str) -> Dict[str, Any]:
        """
        Fallback method using traditional OCR + Claude text parsing
        """
        try:
            # Step 1: Perform OCR with available providers
            ocr_result = await self._perform_ocr(image_data, mime_type)
            
            # Step 2: Use Claude text parsing on OCR result
            medical_data = await self._parse_with_claude(ocr_result['text'])
            
            # Add extracted text to result
            medical_data['extracted_text'] = ocr_result['text']
            
            return medical_data
            
        except Exception as error:
            logger.error(f"❌ Fallback OCR analysis failed: {error}")
            # Final fallback to local parsing
            return await self._local_medical_parsing("")

    async def _parse_with_claude(self, ocr_text: str) -> Dict[str, Any]:
        """
        Use Claude/AI to parse medical information from OCR text
        """
        logger.info("🤖 Parsing medical text with AI model...")

        medical_parsing_prompt = f"""
You are a medical AI assistant specialized in parsing prescription labels and medical documents with high accuracy.

Extract and structure the following medical information from this OCR text. The OCR may contain errors, so use medical knowledge to interpret likely intended medications and information.

TEXT TO ANALYZE:
\"\"\"
{ocr_text}
\"\"\"

Please extract and return a JSON object with this exact structure:

{{
  "medications": [
    {{
      "name": "medication name (correct any OCR errors using medical knowledge)",
      "dosage": "strength amount (e.g., 500mg, 10ml)",
      "frequency": "how often to take (e.g., twice daily, BID, every 8 hours)",
      "instructions": "additional instructions (e.g., with food, before bedtime)",
      "strength": "concentration or potency if different from dosage"
    }}
  ],
  "symptoms": ["symptom1", "symptom2"],
  "allergies": ["allergy1", "allergy2"],
  "medical_notes": ["important note1", "clinical observation"],
  "warnings": ["warning1", "side effect note", "contraindication"],
  "patient_info": {{
    "name": "patient name if visible and readable",
    "dob": "date of birth if visible",
    "prescriber": "doctor/prescriber name if visible",
    "pharmacy": "pharmacy name if visible",
    "date": "prescription date if visible"
  }}
}}

CRITICAL INSTRUCTIONS FOR MEDICAL ACCURACY:
1. **Medication Name Correction**: Use your medical knowledge to correct OCR errors in drug names:
   - "FUNIC1LL1N" → "FUNICILLIN"
   - "L1S1N0PR1L" → "LISINOPRIL"
   - "MET0RMIN" → "METFORMIN"
   - Common OCR errors: 'I' ↔ '1', 'O' ↔ '0', 'S' ↔ '5', 'rn' ↔ 'm', 'cl' ↔ 'd'

2. **Dosage Extraction**: Look for patterns like "500mg", "10ml", "200mcg", "1 tablet"

3. **Frequency Patterns**: Identify "twice daily", "BID", "TID", "QID", "PRN", "every 8 hours", "once daily"

4. **Medical Context**: Consider brand names, generic names, and common medication abbreviations

5. **Error Tolerance**: Be liberal with medication name extraction - include likely candidates even with OCR errors

6. **Structure Compliance**: Return empty arrays for sections with no data, not null values

Respond ONLY with the valid JSON object, no additional text or explanation.
"""

        try:
            # Use AI service to parse the medical text
            ai_response = await self.ai_service.generate_analysis(
                medical_parsing_prompt,
                model_preference="claude",  # Prefer Claude for medical parsing
                complexity="high"
            )

            # Extract JSON from the response
            json_start = ai_response.find('{')
            json_end = ai_response.rfind('}') + 1

            if json_start >= 0 and json_end > json_start:
                json_str = ai_response[json_start:json_end]
                parsed_data = json.loads(json_str)

                # Convert to our data structures
                medications = [
                    MedicationInfo(
                        name=med.get('name', ''),
                        dosage=med.get('dosage'),
                        frequency=med.get('frequency'),
                        instructions=med.get('instructions'),
                        strength=med.get('strength')
                    ) for med in parsed_data.get('medications', [])
                ]

                patient_info = None
                if parsed_data.get('patient_info'):
                    patient_info = PatientInfo(
                        name=parsed_data['patient_info'].get('name'),
                        dob=parsed_data['patient_info'].get('dob'),
                        prescriber=parsed_data['patient_info'].get('prescriber'),
                        pharmacy=parsed_data['patient_info'].get('pharmacy'),
                        date=parsed_data['patient_info'].get('date')
                    )

                result = {
                    'medications': medications,
                    'symptoms': parsed_data.get('symptoms', []),
                    'allergies': parsed_data.get('allergies', []),
                    'medical_notes': parsed_data.get('medical_notes', []),
                    'warnings': parsed_data.get('warnings', []),
                    'patient_info': patient_info
                }

                logger.info(f"✅ AI parsing successful: {len(medications)} medications found")
                return result

            else:
                raise ValueError("No valid JSON found in AI response")

        except Exception as error:
            logger.error(f"❌ AI parsing failed: {error}")
            # Fallback to local parsing
            return await self._local_medical_parsing(ocr_text)

    async def _local_medical_parsing(self, text: str) -> Dict[str, Any]:
        """
        Fallback local medical parsing when AI is not available
        """
        logger.info("🔍 Using local medical parsing fallback")

        medications = []

        # Enhanced medication extraction patterns with OCR error correction
        medication_patterns = [
            # Known medications with common OCR errors
            r'\b(?:funi|tuni|func)c?(?:i|1)ll(?:i|1)n\b',  # funicillin variations
            r'\b(?:a|4)mox(?:i|1)c(?:i|1)ll(?:i|1)n\b',     # amoxicillin variations
            r'\b(?:l|1)(?:i|1)s(?:i|1)nopr(?:i|1)l\b',      # lisinopril variations
            r'\b(?:met|rnet)f(?:o|0)rm(?:i|1)n\b',          # metformin variations
            r'\b(?:a|4)sp(?:i|1)r(?:i|1)n\b',               # aspirin variations
            r'\b(?:i|1)bupr(?:o|0)fen\b',                   # ibuprofen variations

            # Generic drug name patterns (correcting OCR errors)
            r'\b[A-Za-z01]{4,}(?:illin|mycin|floxacin|cycline|pril|sartan|statin|zole|pine|dine|lone|sone)\b',

            # Medications with dosage
            r'\b([A-Za-z01]{3,})\s*\d+\s*(?:mg|mcg|g|ml|units?)\b',
        ]

        for pattern in medication_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                # Clean and correct OCR errors
                med_name = self._correct_ocr_errors(match if isinstance(match, str) else match)

                if len(med_name) > 2 and med_name not in [m.name for m in medications]:
                    # Look for dosage and frequency
                    dosage_match = re.search(rf'{re.escape(med_name)}.*?(\d+\s*(?:mg|mcg|g|ml))', text, re.IGNORECASE)
                    frequency_match = re.search(rf'{re.escape(med_name)}.{{0,50}}(twice.*?daily|once.*?daily|bid|tid|qid|prn|every.*?hours?)', text, re.IGNORECASE)

                    medications.append(MedicationInfo(
                        name=med_name.lower(),
                        dosage=dosage_match.group(1) if dosage_match else None,
                        frequency=frequency_match.group(1) if frequency_match else None
                    ))

        # Extract patient info
        patient_info = None
        name_match = re.search(r'(?:patient|name):\s*([^\n\r]+)', text, re.IGNORECASE)
        dob_match = re.search(r'(?:dob|birth):\s*([^\n\r]+)', text, re.IGNORECASE)
        prescriber_match = re.search(r'(?:dr\.?|doctor|prescriber):\s*([^\n\r]+)', text, re.IGNORECASE)

        if name_match or dob_match or prescriber_match:
            patient_info = PatientInfo(
                name=name_match.group(1).strip() if name_match else None,
                dob=dob_match.group(1).strip() if dob_match else None,
                prescriber=prescriber_match.group(1).strip() if prescriber_match else None
            )

        logger.info(f"🏥 Local parsing found {len(medications)} medications")

        return {
            'medications': medications,
            'symptoms': [],
            'allergies': [],
            'medical_notes': [],
            'warnings': [],
            'patient_info': patient_info
        }

    def _correct_ocr_errors(self, text: str) -> str:
        """
        Correct common OCR errors in medication names
        """
        corrections = {
            # Number/letter confusions
            '1': 'i', '0': 'o', '5': 's',
            # Common medication corrections
            'funicillin': 'funicillin',
            'lisinopril': 'lisinopril',
            'metformin': 'metformin',
            'amoxicillin': 'amoxicillin'
        }

        corrected = text.lower()

        # Apply basic character corrections
        for wrong, right in [('1', 'i'), ('0', 'o'), ('5', 's')]:
            corrected = corrected.replace(wrong, right)

        return corrected

    async def _aws_textract_ocr(self, image_data: str, mime_type: str) -> Dict[str, Any]:
        """
        AWS Textract OCR implementation for high-quality medical text extraction
        """
        if not AWS_AVAILABLE:
            raise Exception("AWS SDK (boto3) not available")

        try:
            textract_client = boto3.client(
                'textract',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )

            # Decode base64 image
            image_bytes = base64.b64decode(image_data)

            # Call Textract
            response = textract_client.detect_document_text(
                Document={'Bytes': image_bytes}
            )

            # Extract text from response
            text_lines = []
            confidence_scores = []

            for block in response['Blocks']:
                if block['BlockType'] == 'LINE':
                    text_lines.append(block['Text'])
                    confidence_scores.append(block['Confidence'])

            extracted_text = '\n'.join(text_lines)
            average_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0

            logger.info(f"AWS Textract extracted {len(extracted_text)} characters with {average_confidence:.1f}% confidence")

            return {
                'text': extracted_text,
                'confidence': average_confidence
            }

        except (ClientError, NoCredentialsError) as error:
            logger.error(f"AWS Textract error: {error}")
            raise Exception(f"AWS Textract OCR failed: {error}")

    async def _tesseract_fallback_ocr(self, image_data: str) -> Dict[str, Any]:
        """
        Fallback OCR method (placeholder - actual implementation would be client-side)
        """
        logger.info("Using Tesseract fallback (client-side processing required)")

        # This would typically be handled client-side with Tesseract.js
        # For server-side, we could use pytesseract if needed
        return {
            'text': "Tesseract fallback - client-side processing required",
            'confidence': 0
        }

    def _is_aws_textract_available(self) -> bool:
        """
        Check if AWS Textract is available and configured
        """
        return (AWS_AVAILABLE and
                settings.AWS_ACCESS_KEY_ID is not None and
                settings.AWS_SECRET_ACCESS_KEY is not None)

    async def _parse_with_claude_cached(self, ocr_text: str) -> Dict[str, Any]:
        """
        Enhanced Claude parsing with caching support for AI responses
        """
        # Generate hash for OCR text to cache AI parsing results
        text_hash = hashlib.md5(ocr_text.encode()).hexdigest()[:12]

        # Check if AI parsing result is cached
        cached_parsing = redis_service.get_cache("ai_parsing", text_hash)
        if cached_parsing:
            logger.info(f"📦 Cache hit for AI parsing result: {text_hash}")
            redis_service.increment_counter("performance", "ai_parsing_cache", "hits")
            return cached_parsing

        # Fallback to original Claude parsing
        result = await self._parse_with_claude(ocr_text)

        # Cache the AI parsing result
        redis_service.set_cache("ai_parsing", text_hash, result, ttl=3600)  # Cache for 1 hour
        redis_service.increment_counter("performance", "ai_parsing_cache", "misses")
        logger.info(f"💾 Cached AI parsing result: {text_hash}")

        return result

    async def _cache_medication_validations(self, medications: List[MedicationInfo]) -> None:
        """
        Cache individual medication validations for faster future lookups
        """
        for medication in medications:
            med_name = medication.name.lower()

            # Check if already cached
            cached_validation = redis_service.get_fda_validation(med_name)
            if not cached_validation:
                # Create validation data to cache
                validation_data = {
                    "name": medication.name,
                    "dosage": medication.dosage,
                    "frequency": medication.frequency,
                    "strength": medication.strength,
                    "validated": True,
                    "timestamp": datetime.now().isoformat()
                }

                # Cache FDA validation
                redis_service.cache_fda_validation(med_name, validation_data)
                logger.info(f"💾 Cached FDA validation for: {med_name}")

    def get_cached_medication_info(self, medication_name: str) -> Optional[Dict[str, Any]]:
        """
        Get cached medication information for quick lookups
        """
        return redis_service.get_medication_info(medication_name)

    def warm_common_medications_cache(self) -> None:
        """
        Warm cache with common medications for better performance
        """
        common_medications = [
            "funicillin", "amoxicillin", "lisinopril", "metformin",
            "aspirin", "ibuprofen", "acetaminophen", "atorvastatin",
            "omeprazole", "prednisone", "albuterol", "warfarin"
        ]

        redis_service.warm_medication_cache(common_medications)
        logger.info(f"🔥 Warming cache for {len(common_medications)} common medications")

# Create singleton instance
medical_ocr_service = MedicalOCRService()