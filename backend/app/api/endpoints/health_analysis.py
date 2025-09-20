from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncio
import json
import hashlib
import uuid
from app.services.ai_models import AIModelService
from app.services.multi_agent_intelligence import MultiAgentDrugIntelligence
from app.services.redis_service import redis_service

router = APIRouter()

class HealthAnalysisRequest(BaseModel):
    concern: str
    symptoms: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    medical_history: Optional[List[str]] = None
    current_medications: Optional[List[str]] = None

class HealthAnalysisResult(BaseModel):
    condition: str
    explanation: str
    natural_remedies: List[str]
    severity: str  # 'mild', 'moderate', 'critical'
    recommendation: str
    when_to_see_doctor: List[str]
    detected_medications: Optional[List[Dict[str, Any]]] = None

@router.post("/analyze-health", response_model=HealthAnalysisResult)
async def analyze_health_concern(request: HealthAnalysisRequest):
    """
    Analyze health concerns and symptoms using AI models with real-time data
    """
    try:
        # Generate unique session ID for this analysis
        session_id = str(uuid.uuid4())

        # Create cache key based on request content
        request_hash = _generate_request_hash(request)

        # Try to get cached result first
        cached_result = redis_service.get_cache("health_analysis", request_hash)
        if cached_result:
            print(f"Cache hit for health analysis: {request_hash}")
            # Increment usage counter
            redis_service.increment_counter("usage", "health_analysis", "hits")
            return HealthAnalysisResult(**cached_result)

        # Cache user symptom inputs for session tracking
        symptom_data = {
            "concern": request.concern,
            "symptoms": request.symptoms,
            "patient_age": request.patient_age,
            "patient_gender": request.patient_gender,
            "medical_history": request.medical_history,
            "current_medications": request.current_medications,
            "timestamp": str(asyncio.get_event_loop().time())
        }
        redis_service.cache_symptom_input(session_id, symptom_data)

        # Initialize AI service
        ai_service = AIModelService()

        # Create detailed prompt for health analysis
        prompt = _create_health_analysis_prompt(request)

        # Generate AI analysis using AWS Bedrock (Claude Sonnet for medical analysis)
        raw_analysis = await ai_service.generate_analysis(
            prompt,
            model_preference="claude",  # Use Claude for medical analysis
            complexity="high"
        )

        # Parse and structure the AI response
        structured_result = await _parse_health_analysis(raw_analysis, request)

        # If current medications are mentioned, analyze interactions
        if request.current_medications:
            # Check if medication interaction analysis is cached
            med_cache_key = "_".join(sorted([med.lower().replace(" ", "_") for med in request.current_medications]))
            cached_interactions = redis_service.get_cache("medication_interactions", med_cache_key)

            if cached_interactions:
                structured_result.detected_medications = cached_interactions
            else:
                interaction_analysis = await _analyze_medication_interactions(
                    request.current_medications,
                    structured_result.condition,
                    ai_service
                )
                structured_result.detected_medications = interaction_analysis

                # Cache interaction analysis
                if interaction_analysis:
                    redis_service.set_cache(
                        "medication_interactions",
                        med_cache_key,
                        interaction_analysis,
                        ttl=86400  # Cache for 24 hours
                    )

        # Cache the complete analysis result
        result_dict = structured_result.dict()
        redis_service.set_cache(
            "health_analysis",
            request_hash,
            result_dict,
            ttl=3600  # Cache for 1 hour
        )

        # Cache AI summary for quick access
        ai_summary = {
            "analysis_id": session_id,
            "condition": structured_result.condition,
            "severity": structured_result.severity,
            "recommendation": structured_result.recommendation,
            "timestamp": str(asyncio.get_event_loop().time()),
            "request_hash": request_hash
        }
        redis_service.cache_ai_summary(session_id, ai_summary)

        # Increment usage counter
        redis_service.increment_counter("usage", "health_analysis", "requests")

        return structured_result

    except Exception as e:
        print(f"Health analysis error: {e}")
        # Log error for monitoring
        redis_service.increment_counter("errors", "health_analysis", "failures")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze health concern: {str(e)}"
        )

def _generate_request_hash(request: HealthAnalysisRequest) -> str:
    """Generate a hash for the request to use as cache key"""
    # Create a consistent string representation of the request
    request_data = {
        "concern": request.concern.lower().strip(),
        "symptoms": request.symptoms.lower().strip(),
        "patient_age": request.patient_age,
        "patient_gender": request.patient_gender.lower() if request.patient_gender else None,
        "medical_history": sorted([h.lower().strip() for h in request.medical_history]) if request.medical_history else None,
        "current_medications": sorted([m.lower().strip() for m in request.current_medications]) if request.current_medications else None,
    }

    # Convert to string and hash
    request_str = json.dumps(request_data, sort_keys=True)
    return hashlib.md5(request_str.encode()).hexdigest()

def _create_health_analysis_prompt(request: HealthAnalysisRequest) -> str:
    """Create a comprehensive prompt for AI health analysis"""

    # Build patient context
    patient_context = ""
    if request.patient_age:
        patient_context += f"Patient age: {request.patient_age}\n"
    if request.patient_gender:
        patient_context += f"Patient gender: {request.patient_gender}\n"
    if request.medical_history:
        patient_context += f"Medical history: {', '.join(request.medical_history)}\n"
    if request.current_medications:
        patient_context += f"Current medications: {', '.join(request.current_medications)}\n"

    prompt = f"""
    As a medical AI assistant with expertise in symptom analysis and natural health approaches, analyze the following health concern:

    PATIENT INFORMATION:
    {patient_context}

    CHIEF CONCERN: {request.concern}

    SYMPTOMS DESCRIBED: {request.symptoms}

    Please provide a comprehensive analysis in the following JSON format:

    {{
        "condition": "Most likely condition or health issue based on symptoms",
        "explanation": "Detailed explanation of why these symptoms occur, the underlying mechanisms, and what's happening in the body (2-3 sentences)",
        "natural_remedies": [
            "Evidence-based natural remedy 1 with specific instructions",
            "Evidence-based natural remedy 2 with specific instructions",
            "Evidence-based natural remedy 3 with specific instructions",
            "Evidence-based natural remedy 4 with specific instructions",
            "Evidence-based natural remedy 5 with specific instructions",
            "Evidence-based natural remedy 6 with specific instructions",
            "Evidence-based natural remedy 7 with specific instructions",
            "Evidence-based natural remedy 8 with specific instructions"
        ],
        "severity": "mild|moderate|critical",
        "recommendation": "Comprehensive recommendation focusing on natural approaches, monitoring symptoms, and supporting the body's healing processes (3-4 sentences)",
        "when_to_see_doctor": [
            "Specific warning sign 1 that requires medical attention",
            "Specific warning sign 2 that requires medical attention",
            "Specific warning sign 3 that requires medical attention",
            "Specific warning sign 4 that requires medical attention",
            "Specific warning sign 5 that requires medical attention",
            "Specific warning sign 6 that requires medical attention",
            "Specific warning sign 7 that requires medical attention"
        ]
    }}

    IMPORTANT GUIDELINES:
    - Base your analysis on evidence-based medical knowledge
    - Focus on natural, safe remedies that complement conventional treatment
    - Consider the patient's age, gender, and medical history if provided
    - Be specific about dosages, timing, and preparation methods for natural remedies
    - Include lifestyle modifications and preventive measures
    - Provide clear warning signs that require immediate medical attention
    - Never replace professional medical diagnosis or treatment
    - If current medications are mentioned, note potential interactions in the explanation

    Respond ONLY with the JSON object, no additional text.
    """

    return prompt

async def _parse_health_analysis(raw_analysis: str, request: HealthAnalysisRequest) -> HealthAnalysisResult:
    """Parse AI response and create structured result"""

    try:
        # Extract JSON from the response
        json_start = raw_analysis.find('{')
        json_end = raw_analysis.rfind('}') + 1

        if json_start >= 0 and json_end > json_start:
            json_str = raw_analysis[json_start:json_end]
            parsed_data = json.loads(json_str)

            return HealthAnalysisResult(
                condition=parsed_data.get('condition', 'Health concern requiring attention'),
                explanation=parsed_data.get('explanation', 'Based on the symptoms described, this appears to be a health issue that may benefit from natural remedies and lifestyle modifications.'),
                natural_remedies=parsed_data.get('natural_remedies', [
                    'Stay well hydrated with water throughout the day',
                    'Ensure adequate rest and quality sleep (7-9 hours)',
                    'Eat a balanced diet rich in fruits, vegetables, and whole grains',
                    'Practice stress reduction techniques (deep breathing, meditation)',
                    'Gentle exercise if feeling well enough (walking, stretching)',
                    'Consider herbal teas like chamomile or ginger for general wellness',
                    'Maintain good hygiene and avoid known triggers',
                    'Listen to your body and rest when needed'
                ]),
                severity=parsed_data.get('severity', 'mild'),
                recommendation=parsed_data.get('recommendation', 'Try natural approaches and monitor your symptoms. Focus on supporting your body\'s natural healing processes through rest, nutrition, and stress management. Consider professional medical advice if symptoms persist or worsen.'),
                when_to_see_doctor=parsed_data.get('when_to_see_doctor', [
                    'Symptoms worsen or don\'t improve after a reasonable time',
                    'You develop additional concerning symptoms',
                    'You have underlying health conditions that may be affected',
                    'You feel unsure about your condition or need reassurance',
                    'Symptoms significantly interfere with daily activities',
                    'You experience severe pain or discomfort',
                    'Any symptom that causes you significant concern'
                ])
            )
        else:
            raise ValueError("No valid JSON found in AI response")

    except (json.JSONDecodeError, ValueError, KeyError) as e:
        print(f"Failed to parse AI response: {e}")
        # Return fallback analysis based on request
        return _create_fallback_analysis(request)

def _create_fallback_analysis(request: HealthAnalysisRequest) -> HealthAnalysisResult:
    """Create fallback analysis when AI parsing fails"""

    # Analyze concern for basic condition matching
    concern_lower = request.concern.lower()
    symptoms_lower = request.symptoms.lower()

    # Determine likely condition
    condition = "General health concern"
    if any(word in concern_lower or word in symptoms_lower for word in ['headache', 'head', 'migraine']):
        condition = "Headache or head discomfort"
    elif any(word in concern_lower or word in symptoms_lower for word in ['stomach', 'nausea', 'gastritis', 'digestive']):
        condition = "Digestive discomfort"
    elif any(word in concern_lower or word in symptoms_lower for word in ['stress', 'anxiety', 'worried']):
        condition = "Stress-related symptoms"
    elif any(word in concern_lower or word in symptoms_lower for word in ['tired', 'fatigue', 'exhausted']):
        condition = "Fatigue and low energy"

    return HealthAnalysisResult(
        condition=condition,
        explanation="Based on the symptoms you've described, this appears to be a common health issue that may benefit from natural remedies and lifestyle modifications. Your body often has natural healing mechanisms that can be supported through proper self-care.",
        natural_remedies=[
            "Stay well hydrated with water throughout the day",
            "Ensure adequate rest and quality sleep (7-9 hours)",
            "Eat a balanced diet rich in fruits, vegetables, and whole grains",
            "Practice stress reduction techniques (deep breathing, meditation)",
            "Gentle exercise if feeling well enough (walking, stretching)",
            "Consider herbal teas like chamomile or ginger for general wellness",
            "Maintain good hygiene and avoid known triggers",
            "Listen to your body and rest when needed"
        ],
        severity="mild",
        recommendation=_create_medication_aware_recommendation(request),
        when_to_see_doctor=[
            "Symptoms worsen or don't improve after a reasonable time",
            "You develop additional concerning symptoms",
            "You have underlying health conditions that may be affected",
            "You feel unsure about your condition or need reassurance",
            "Symptoms significantly interfere with daily activities",
            "You experience severe pain or discomfort",
            "If you're experiencing dizziness or fatigue, this could be related to your medication. Consult your healthcare provider if symptoms persist or worsen, as dosage adjustments may be needed"
        ]
    )

def _create_medication_aware_recommendation(request: HealthAnalysisRequest) -> str:
    """Create medication-aware recommendation"""
    base_recommendation = "Try natural approaches and monitor your symptoms. Focus on supporting your body's natural healing processes through rest, nutrition, and stress management. Consider professional medical advice if symptoms persist or worsen."

    if request.current_medications:
        # Common medication side effects mapping
        medication_effects = {
            'metoprolol': 'dizziness or lightheadedness and fatigue or tiredness',
            'lisinopril': 'dry cough and dizziness',
            'amlodipine': 'swelling in legs or ankles and dizziness',
            'atorvastatin': 'muscle pain and weakness',
            'simvastatin': 'muscle pain and weakness',
            'omeprazole': 'headache and digestive changes',
            'prednisone': 'increased blood sugar and mood changes',
            'warfarin': 'increased bleeding risk',
            'insulin': 'low blood sugar symptoms',
            'hydrochlorothiazide': 'dizziness and electrolyte imbalances'
        }

        medication_info = []
        for med in request.current_medications:
            med_lower = med.lower()
            if 'metoprolol' in med_lower:
                medication_info.append("Metoprolol (Beta-blocker (Selective β1-adrenergic antagonist)), it's important to monitor for potential side effects such as dizziness or lightheadedness and fatigue or tiredness")
            elif any(known_med in med_lower for known_med in medication_effects.keys()):
                for known_med, effects in medication_effects.items():
                    if known_med in med_lower:
                        medication_info.append(f"{med}, monitor for potential side effects such as {effects}")
                        break
            else:
                medication_info.append(f"{med}, monitor for potential side effects")

        if medication_info:
            med_text = "Since you're taking " + " and ".join(medication_info) + ". If you're experiencing symptoms that could be medication-related, consult your healthcare provider as dosage adjustments may be needed."
            return f"{base_recommendation} {med_text}"

    return base_recommendation

async def _analyze_medication_interactions(medications: List[str], condition: str, ai_service: AIModelService) -> List[Dict[str, Any]]:
    """Analyze current medications for potential interactions and side effects"""

    try:
        prompt = f"""
        Analyze the following medications for a patient with {condition}:

        Medications: {', '.join(medications)}

        Provide analysis for each medication in JSON format:
        {{
            "medications": [
                {{
                    "name": "medication name",
                    "class": "drug class",
                    "uses": ["primary use 1", "primary use 2"],
                    "common_side_effects": ["side effect 1", "side effect 2", "side effect 3"],
                    "relevant_to_condition": "how this medication might relate to current symptoms"
                }}
            ]
        }}

        Focus on medications that could cause symptoms like dizziness, fatigue, or other effects related to the patient's condition.
        """

        analysis = await ai_service.generate_analysis(prompt, model_preference="claude")

        # Parse JSON response
        json_start = analysis.find('{')
        json_end = analysis.rfind('}') + 1

        if json_start >= 0 and json_end > json_start:
            json_str = analysis[json_start:json_end]
            parsed_data = json.loads(json_str)
            return parsed_data.get('medications', [])

    except Exception as e:
        print(f"Medication analysis error: {e}")

    # Return fallback medication info
    return [
        {
            "name": med,
            "class": "Prescription medication",
            "uses": ["As prescribed by healthcare provider"],
            "common_side_effects": ["Consult prescribing information", "Monitor for side effects"],
            "relevant_to_condition": "May be related to current symptoms - consult healthcare provider"
        } for med in medications
    ]