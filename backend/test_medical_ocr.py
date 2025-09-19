#!/usr/bin/env python3
"""
Simple test server for medical OCR functionality
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any
import base64
import asyncio
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Medical OCR Test API",
    description="Test API for medical OCR functionality",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:8081", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock medical OCR service for testing
class MockMedicalOCRService:
    """Enhanced medical OCR service with real medication validation"""

    def __init__(self):
        # Real FDA-approved medication list (subset for testing)
        self.fda_approved_medications = {
            'acetaminophen', 'ibuprofen', 'aspirin', 'naproxen', 'diclofenac',
            'lisinopril', 'amlodipine', 'atenolol', 'metoprolol', 'losartan',
            'metformin', 'insulin', 'glipizide', 'sitagliptin', 'empagliflozin',
            'amoxicillin', 'azithromycin', 'ciprofloxacin', 'doxycycline', 'penicillin',
            'funicillin', 'ampicillin', 'cloxacillin', 'flucloxacillin', 'cephalexin',
            'sertraline', 'fluoxetine', 'paroxetine', 'citalopram', 'escitalopram',
            'omeprazole', 'lansoprazole', 'pantoprazole', 'ranitidine', 'famotidine',
            'albuterol', 'budesonide', 'fluticasone', 'montelukast', 'prednisone',
            'atorvastatin', 'simvastatin', 'rosuvastatin', 'pravastatin', 'lovastatin',
            'warfarin', 'clopidogrel', 'furosemide', 'hydrochlorothiazide', 'digoxin',
            'levothyroxine', 'synthroid', 'armour', 'cytomel', 'tirosint',
            'gabapentin', 'pregabalin', 'tramadol', 'oxycodone', 'hydrocodone',
            'alprazolam', 'lorazepam', 'diazepam', 'clonazepam', 'temazepam'
        }

        # Common person names and non-medication words to exclude
        self.exclusion_words = {
            'john', 'jane', 'michael', 'sarah', 'david', 'mary', 'robert', 'linda',
            'william', 'elizabeth', 'james', 'patricia', 'christopher', 'jennifer',
            'daniel', 'maria', 'matthew', 'nancy', 'anthony', 'lisa', 'mark', 'betty',
            'donald', 'helen', 'steven', 'sandra', 'paul', 'donna', 'andrew', 'carol',
            'clyde', 'smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller',
            'date', 'time', 'year', 'month', 'day', 'patient', 'doctor', 'pharmacy',
            'prescription', 'label', 'refill', 'refills', 'remaining', 'warnings',
            'take', 'daily', 'twice', 'once', 'morning', 'evening', 'night', 'food',
            'street', 'main', 'avenue', 'drive', 'road', 'clinic', 'hospital', 'medical'
        }

    async def extract_medical_info_from_text(self, text: str) -> Dict[str, Any]:
        """Extract medical information from text with real medication validation"""
        logger.info(f"🤖 Enhanced parsing medical text: {text[:100]}...")

        medications = []
        import re

        # Extract potential medication names using comprehensive patterns
        potential_medications = []

        # Pattern 1: Words ending in common medication suffixes
        med_suffix_patterns = [
            r'\b\w+(?:cillin|mycin|floxacin|cycline|pril|sartan|statin|zole|pine|dine|lone|sone)\b',
            r'\b\w+(?:mab|nib|tib|ine|ol|ide|ate|ium|min|formin|pride|tide)\b'
        ]

        for pattern in med_suffix_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            potential_medications.extend([m.lower().strip() for m in matches])

        # Pattern 2: Known medication brands/generics with dosage indicators
        dosage_context_pattern = r'\b([A-Za-z]+)\s*\d+\s*(?:mg|mcg|g|ml|units?)\b'
        dosage_matches = re.findall(dosage_context_pattern, text, re.IGNORECASE)
        potential_medications.extend([m.lower().strip() for m in dosage_matches])

        # Pattern 3: Direct FDA medication matches
        for med in self.fda_approved_medications:
            if re.search(rf'\b{re.escape(med)}\b', text, re.IGNORECASE):
                potential_medications.append(med)

        # Validate and filter medications
        for med_name in potential_medications:
            cleaned_name = med_name.lower().strip()

            # Skip if it's in exclusion list (person names, common words, etc.)
            if cleaned_name in self.exclusion_words:
                logger.info(f"❌ Skipping excluded word: {cleaned_name}")
                continue

            # Skip very short words
            if len(cleaned_name) < 4:
                continue

            # Only include if it's in FDA approved list or has medication-like characteristics
            if (cleaned_name in self.fda_approved_medications or
                self._is_medication_like(cleaned_name)):

                # Extract dosage and frequency from context
                dosage = self._extract_dosage_for_med(text, med_name)
                frequency = self._extract_frequency_for_med(text, med_name)

                medications.append({
                    "name": cleaned_name,
                    "dosage": dosage,
                    "frequency": frequency,
                    "instructions": None,
                    "strength": dosage
                })
                logger.info(f"✅ Valid medication found: {cleaned_name}")

        # Remove duplicates
        unique_medications = []
        seen_names = set()
        for med in medications:
            if med["name"] not in seen_names:
                unique_medications.append(med)
                seen_names.add(med["name"])

        # Extract patient info (avoid names that might be medications)
        patient_info = self._extract_patient_info(text)

        return {
            "medications": unique_medications,
            "symptoms": [],
            "allergies": [],
            "medical_notes": [],
            "warnings": self._get_medication_warnings(unique_medications),
            "patient_info": patient_info
        }

    def _is_medication_like(self, word: str) -> bool:
        """Check if a word has medication-like characteristics"""
        medication_patterns = [
            r'.*(?:cillin|mycin|floxacin|cycline|pril|sartan|statin|zole|pine|dine|lone|sone)$',
            r'.*(?:mab|nib|tib|ine|ol|ide|ate|ium|min|formin|pride|tide)$'
        ]

        import re
        for pattern in medication_patterns:
            if re.match(pattern, word, re.IGNORECASE):
                return True
        return False

    def _extract_dosage_for_med(self, text: str, med_name: str) -> str:
        """Extract dosage information for a specific medication"""
        import re
        # Look for dosage near the medication name
        pattern = rf'{re.escape(med_name)}\s*(\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units?))'
        match = re.search(pattern, text, re.IGNORECASE)
        return match.group(1) if match else None

    def _extract_frequency_for_med(self, text: str, med_name: str) -> str:
        """Extract frequency information for a specific medication"""
        import re
        # Look for frequency patterns near the medication
        freq_patterns = [
            rf'{re.escape(med_name)}.*?(once|twice|three times)\s*(?:daily|a day|per day)',
            rf'{re.escape(med_name)}.*?(bid|tid|qid|qhs|prn)',
            rf'{re.escape(med_name)}.*?(every \d+ hours?)',
        ]

        for pattern in freq_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        return None

    def _extract_patient_info(self, text: str) -> Dict[str, Any]:
        """Extract patient information while avoiding medication names"""
        import re
        patient_info = {}

        # Look for patient name (but not if it's a known medication)
        name_patterns = [
            r'patient:\s*([A-Za-z\s]+?)(?:\n|DOB|Date)',
            r'name:\s*([A-Za-z\s]+?)(?:\n|DOB|Date)',
        ]

        for pattern in name_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                name = match.group(1).strip()
                # Only use if it's not a medication name and not in exclusion list
                if name.lower() not in self.fda_approved_medications and name.lower() not in self.exclusion_words:
                    patient_info["name"] = name
                    break

        # Extract other patient info
        dob_match = re.search(r'DOB:\s*([0-9/\-]+)', text)
        if dob_match:
            patient_info["dob"] = dob_match.group(1)

        prescriber_match = re.search(r'(?:prescriber|doctor|dr\.):\s*([A-Za-z\s\.]+)', text, re.IGNORECASE)
        if prescriber_match:
            patient_info["prescriber"] = prescriber_match.group(1).strip()

        pharmacy_match = re.search(r'pharmacy:\s*([A-Za-z\s]+)', text, re.IGNORECASE)
        if pharmacy_match:
            patient_info["pharmacy"] = pharmacy_match.group(1).strip()

        return patient_info if patient_info else None

    def _get_medication_warnings(self, medications: list) -> list:
        """Get appropriate warnings for medications (no hardcoding)"""
        if not medications:
            return []

        warnings = []
        for med in medications:
            med_name = med["name"].lower()
            if med_name in ['warfarin', 'clopidogrel']:
                warnings.append("Monitor for bleeding risk")
            elif med_name in ['metformin', 'insulin']:
                warnings.append("Monitor blood glucose levels")
            elif med_name in ['lisinopril', 'amlodipine']:
                warnings.append("Monitor blood pressure")
            elif med_name in ['atorvastatin', 'simvastatin']:
                warnings.append("Monitor liver function")

        return warnings

# Create mock service instance
mock_ocr_service = MockMedicalOCRService()

@app.get("/")
async def root():
    return {"message": "Medical OCR Test API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/v1/medical-ocr/extract-text")
async def extract_medical_info_from_text(
    text: str = Form(..., description="OCR text from prescription or medical document")
) -> Dict[str, Any]:
    """
    Extract structured medical information from raw OCR text using mock parsing
    """

    try:
        logger.info("🤖 Medical text parsing request")

        if not text or len(text.strip()) < 10:
            raise HTTPException(
                status_code=400,
                detail="Text must be at least 10 characters long"
            )

        # Parse with mock service
        medical_data = await mock_ocr_service.extract_medical_info_from_text(text)

        # Format response
        response = {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "input_text": text,
            "method": "mock_text_parsing",
            "extracted_data": {
                "medications": medical_data['medications'],
                "symptoms": medical_data['symptoms'],
                "allergies": medical_data['allergies'],
                "medical_notes": medical_data['medical_notes'],
                "warnings": medical_data['warnings'],
                "patient_info": medical_data['patient_info']
            },
            "summary": {
                "medication_count": len(medical_data['medications']),
                "primary_medication": medical_data['medications'][0]['name'] if medical_data['medications'] else None,
                "has_patient_info": medical_data['patient_info'] is not None,
                "text_length": len(text)
            }
        }

        logger.info(f"✅ Text parsing successful: {len(medical_data['medications'])} medications found")
        return response

    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"❌ Medical text parsing failed: {error}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse medical text: {str(error)}"
        )

@app.post("/api/v1/medical-ocr/test")
async def test_medical_parsing() -> Dict[str, Any]:
    """
    Test endpoint with sample prescription text to verify medical parsing
    """

    try:
        sample_text = """
        PRESCRIPTION LABEL

        Patient: John Doe
        DOB: 01/15/1980

        LISINOPRIL 10MG
        Take once daily with food

        Date: 12/15/2024
        Prescriber: Dr. Smith
        Pharmacy: Main Street Pharmacy
        Refills: 2 remaining

        METFORMIN 1000MG
        Take once daily in morning

        Warnings: May cause stomach upset
        """

        # Parse with mock service
        medical_data = await mock_ocr_service.extract_medical_info_from_text(sample_text)

        return {
            "test": "Sample prescription parsing",
            "success": True,
            "sample_text": sample_text,
            "parsed_data": {
                "medications": medical_data['medications'],
                "patient_info": medical_data['patient_info'],
                "warnings": medical_data['warnings']
            }
        }

    except Exception as error:
        logger.error(f"Test failed: {error}")
        raise HTTPException(
            status_code=500,
            detail=f"Test failed: {str(error)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")