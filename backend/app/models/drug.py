from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class DrugAnalysisType(str, Enum):
    OVERVIEW = "overview"
    MARKET_RESEARCH = "market_research"
    CLINICAL_TRIALS = "clinical_trials"
    COMPETITIVE_ANALYSIS = "competitive_analysis"
    SAFETY_PROFILE = "safety_profile"
    PRICING_ANALYSIS = "pricing_analysis"

class DrugRequest(BaseModel):
    drug_name: str
    analysis_type: DrugAnalysisType
    include_competitors: bool = True
    include_market_data: bool = True
    include_clinical_data: bool = True

class MarketData(BaseModel):
    market_size: Optional[str] = None
    growth_rate: Optional[str] = None
    key_players: List[str] = []
    market_share: Optional[Dict[str, float]] = None
    pricing_data: Optional[Dict[str, Any]] = None

class ClinicalTrial(BaseModel):
    title: str
    phase: Optional[str] = None
    status: str
    sponsor: str
    condition: str
    study_url: Optional[str] = None
    start_date: Optional[datetime] = None

class CompetitorAnalysis(BaseModel):
    competitor_name: str
    market_share: Optional[float] = None
    strengths: List[str] = []
    weaknesses: List[str] = []
    key_products: List[str] = []
    recent_developments: List[str] = []

class DrugAnalysisResult(BaseModel):
    drug_name: str
    analysis_type: DrugAnalysisType

    # Basic Information
    generic_name: Optional[str] = None
    brand_names: List[str] = []
    manufacturer: Optional[str] = None
    drug_class: Optional[str] = None
    indication: Optional[str] = None

    # Market Intelligence
    market_data: Optional[MarketData] = None
    competitors: List[CompetitorAnalysis] = []

    # Clinical Data
    clinical_trials: List[ClinicalTrial] = []
    safety_warnings: List[str] = []
    efficacy_data: Optional[Dict[str, Any]] = None

    # Analysis Metadata
    analysis_id: str
    created_at: datetime
    data_sources: List[str] = []
    data_sources_with_links: List[Dict[str, Any]] = []
    confidence_score: Optional[float] = None

    # Additional Insights
    swot_analysis: Optional[Dict[str, List[str]]] = None
    market_trends: List[str] = []
    regulatory_updates: List[str] = []

class AnalysisProgress(BaseModel):
    analysis_id: str
    status: str  # "queued", "in_progress", "completed", "failed"
    progress_percentage: int
    current_step: str
    estimated_completion: Optional[datetime] = None
    results: Optional[DrugAnalysisResult] = None