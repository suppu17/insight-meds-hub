"""
Medical OCR API Endpoints

Provides advanced OCR → Claude medical text parsing for prescription images
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import Dict, Any, Optional
import base64
import asyncio
import logging
from datetime import datetime

from app.services.medical_ocr_service import medical_ocr_service, MedicalEntity

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/medical-ocr/extract")
async def extract_medical_info_from_image(
    image: UploadFile = File(..., description="Prescription or medical document image")
) -> Dict[str, Any]:
    """
    Extract structured medical information from prescription image using advanced OCR + Claude parsing

    Process:
    1. Multiple OCR providers (AWS Textract, Tesseract)
    2. Claude AI medical text parsing
    3. Structured medical data extraction
    """

    try:
        logger.info(f"🏥 Medical OCR request for file: {image.filename}")

        # Validate file
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="Only image files are supported (JPG, PNG, GIF, WebP, etc.)"
            )

        # Validate file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        image_content = await image.read()
        if len(image_content) > max_size:
            raise HTTPException(
                status_code=400,
                detail="File size must be less than 10MB"
            )

        # Convert to base64
        image_base64 = base64.b64encode(image_content).decode('utf-8')

        # Extract medical information
        medical_data: MedicalEntity = await medical_ocr_service.extract_medical_info(
            image_base64,
            image.content_type
        )

        # Format response
        response = {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "filename": image.filename,
            "ocr_provider": medical_data.ocr_provider,
            "confidence": medical_data.confidence,
            "raw_text": medical_data.raw_text,
            "extracted_data": {
                "medications": [
                    {
                        "name": med.name,
                        "dosage": med.dosage,
                        "frequency": med.frequency,
                        "instructions": med.instructions,
                        "strength": med.strength
                    } for med in medical_data.medications
                ],
                "symptoms": medical_data.symptoms,
                "allergies": medical_data.allergies,
                "medical_notes": medical_data.medical_notes,
                "warnings": medical_data.warnings,
                "patient_info": {
                    "name": medical_data.patient_info.name if medical_data.patient_info else None,
                    "dob": medical_data.patient_info.dob if medical_data.patient_info else None,
                    "prescriber": medical_data.patient_info.prescriber if medical_data.patient_info else None,
                    "pharmacy": medical_data.patient_info.pharmacy if medical_data.patient_info else None,
                    "date": medical_data.patient_info.date if medical_data.patient_info else None
                } if medical_data.patient_info else None
            },
            "summary": {
                "medication_count": len(medical_data.medications),
                "primary_medication": medical_data.medications[0].name if medical_data.medications else None,
                "has_patient_info": medical_data.patient_info is not None,
                "text_length": len(medical_data.raw_text)
            }
        }

        logger.info(f"✅ Medical OCR successful: {len(medical_data.medications)} medications found")
        return response

    except HTTPException:
        raise
    except Exception as error:
        logger.error(f"❌ Medical OCR extraction failed: {error}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process medical document: {str(error)}"
        )

@router.post("/medical-ocr/extract-text")
async def extract_medical_info_from_text(
    text: str = Form(..., description="OCR text from prescription or medical document")
) -> Dict[str, Any]:
    """
    Extract structured medical information from raw OCR text using Claude parsing

    Useful when OCR is done externally and you just need the medical parsing
    """

    try:
        logger.info("🤖 Medical text parsing request")

        if not text or len(text.strip()) < 10:
            raise HTTPException(
                status_code=400,
                detail="Text must be at least 10 characters long"
            )

        # Create a mock OCR result and parse with Claude
        # We'll use the local parsing method directly
        medical_data = await medical_ocr_service._parse_with_claude(text)

        # Format response
        response = {
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "input_text": text,
            "method": "claude_text_parsing",
            "extracted_data": {
                "medications": [
                    {
                        "name": med.name,
                        "dosage": med.dosage,
                        "frequency": med.frequency,
                        "instructions": med.instructions,
                        "strength": med.strength
                    } for med in medical_data['medications']
                ],
                "symptoms": medical_data['symptoms'],
                "allergies": medical_data['allergies'],
                "medical_notes": medical_data['medical_notes'],
                "warnings": medical_data['warnings'],
                "patient_info": {
                    "name": medical_data['patient_info'].name if medical_data['patient_info'] else None,
                    "dob": medical_data['patient_info'].dob if medical_data['patient_info'] else None,
                    "prescriber": medical_data['patient_info'].prescriber if medical_data['patient_info'] else None,
                    "pharmacy": medical_data['patient_info'].pharmacy if medical_data['patient_info'] else None,
                    "date": medical_data['patient_info'].date if medical_data['patient_info'] else None
                } if medical_data['patient_info'] else None
            },
            "summary": {
                "medication_count": len(medical_data['medications']),
                "primary_medication": medical_data['medications'][0].name if medical_data['medications'] else None,
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

@router.get("/medical-ocr/health")
async def get_medical_ocr_health() -> Dict[str, Any]:
    """
    Get health status of medical OCR service and available providers
    """

    try:
        # Check available OCR providers
        providers_status = {
            "aws_textract": medical_ocr_service._is_aws_textract_available(),
            "tesseract_fallback": True  # Always available client-side
        }

        # Test AI service
        try:
            test_response = await medical_ocr_service.ai_service.generate_analysis(
                "Test medical parsing capability",
                model_preference="claude",
                complexity="low"
            )
            ai_available = bool(test_response)
        except:
            ai_available = False

        return {
            "service": "Medical OCR Service",
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "ocr_providers": providers_status,
            "ai_parsing": {
                "claude_available": ai_available,
                "fallback_parsing": True
            },
            "capabilities": {
                "image_formats": ["JPG", "PNG", "GIF", "WebP", "BMP", "TIFF"],
                "max_file_size_mb": 10,
                "ocr_providers": list(providers_status.keys()),
                "medical_entities": [
                    "medications", "dosages", "frequencies", "symptoms",
                    "allergies", "medical_notes", "warnings", "patient_info"
                ]
            }
        }

    except Exception as error:
        logger.error(f"Health check failed: {error}")
        raise HTTPException(
            status_code=500,
            detail=f"Health check failed: {str(error)}"
        )

@router.post("/medical-ocr/test")
async def test_medical_parsing() -> Dict[str, Any]:
    """
    Test endpoint with sample prescription text to verify medical parsing
    """

    try:
        sample_text = """
        PRESCRIPTION LABEL

        Patient: John Doe
        DOB: 01/15/1980

        FUNICILLIN 500MG
        Take twice daily with food

        Date: 12/15/2024
        Prescriber: Dr. Smith
        Pharmacy: Main Street Pharmacy
        Refills: 2 remaining

        METFORMIN 1000MG
        Take once daily in morning

        Warnings: May cause stomach upset
        """

        # Parse with Claude
        medical_data = await medical_ocr_service._parse_with_claude(sample_text)

        return {
            "test": "Sample prescription parsing",
            "success": True,
            "sample_text": sample_text,
            "parsed_data": {
                "medications": [
                    {
                        "name": med.name,
                        "dosage": med.dosage,
                        "frequency": med.frequency,
                        "instructions": med.instructions
                    } for med in medical_data['medications']
                ],
                "patient_info": {
                    "name": medical_data['patient_info'].name if medical_data['patient_info'] else None,
                    "dob": medical_data['patient_info'].dob if medical_data['patient_info'] else None,
                    "prescriber": medical_data['patient_info'].prescriber if medical_data['patient_info'] else None,
                    "pharmacy": medical_data['patient_info'].pharmacy if medical_data['patient_info'] else None
                } if medical_data['patient_info'] else None,
                "warnings": medical_data['warnings']
            }
        }

    except Exception as error:
        logger.error(f"Test failed: {error}")
        raise HTTPException(
            status_code=500,
            detail=f"Test failed: {str(error)}"
        )