from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Bright Data Configuration
    BRIGHT_DATA_API_KEY: Optional[str] = None
    BRIGHT_DATA_ENDPOINT: str = "https://api.brightdata.com"

    # AWS Bedrock Configuration (matching frontend pattern)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    AWS_BEARER_TOKEN_BEDROCK: Optional[str] = None

    # Bedrock Model IDs
    BEDROCK_CLAUDE_MODEL_ID: str = "anthropic.claude-sonnet-4-20250514-v1:0"
    BEDROCK_NOVA_PREMIER_MODEL_ID: str = "us.amazon.nova-premier-v1:0"
    BEDROCK_NOVA_MICRO_MODEL_ID: str = "us.amazon.nova-micro-v1:0"
    BEDROCK_NOVA_LITE_MODEL_ID: str = "us.amazon.nova-lite-v1:0"

    # Legacy AI Models Configuration (deprecated)
    OPENAI_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None

    # Database Configuration
    DATABASE_URL: str = "sqlite:///./app.db"

    # Redis Cloud Configuration with API Key
    REDIS_URL: str = "redis://localhost:6379"  # Default fallback for local development
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_API_KEY: Optional[str] = "A1yyflastlw544a0y0oo6nfyb6idxw1n3hr5co0cfqvpga0n8hs"  # Redis Cloud API Key

    # Redis Cloud Configuration (auto-detected if API key provided)
    REDIS_CLOUD_HOST: Optional[str] = None  # Will be auto-configured from Redis Cloud
    REDIS_CLOUD_PORT: Optional[int] = None  # Will be auto-configured from Redis Cloud
    REDIS_CLOUD_SSL: bool = True  # Redis Cloud requires SSL

    REDIS_DB: int = 0
    REDIS_DECODE_RESPONSES: bool = True
    REDIS_MAX_CONNECTIONS: int = 20  # Increased for better performance
    REDIS_CONNECTION_TIMEOUT: int = 10  # seconds
    REDIS_SOCKET_TIMEOUT: int = 10  # seconds

    # Enhanced Cache Configuration for Medical App
    CACHE_TTL_USER_SESSION: int = 3600  # 1 hour
    CACHE_TTL_SYMPTOM_INPUT: int = 1800  # 30 minutes
    CACHE_TTL_AI_SUMMARY: int = 7200  # 2 hours
    CACHE_TTL_DRUG_ANALYSIS: int = 86400  # 24 hours

    # New cache TTLs for enhanced features
    CACHE_TTL_OCR_RESULTS: int = 3600  # 1 hour - OCR processing results
    CACHE_TTL_FDA_VALIDATION: int = 86400  # 24 hours - FDA medication validation
    CACHE_TTL_MEDICATION_INFO: int = 604800  # 1 week - Static medication information
    CACHE_TTL_SESSION_STATE: int = 1800  # 30 minutes - Frontend session state
    CACHE_TTL_USER_PREFERENCES: int = 604800  # 1 week - User preferences
    CACHE_TTL_ANALYSIS_PROGRESS: int = 300  # 5 minutes - Real-time analysis progress

    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Insight Meds Hub"

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 3600  # 1 hour

    # External APIs
    FDA_API_BASE: str = "https://api.fda.gov"
    PUBMED_API_BASE: str = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
    CLINICALTRIALS_API: str = "https://clinicaltrials.gov/api/query"
    
    # fal.ai API Configuration (for Video and Image Generation)
    FAL_API_KEY: Optional[str] = None
    FAL_API_BASE: str = "https://fal.run"
    
    # AWS S3 Configuration (for Video Storage)
    AWS_S3_BUCKET_NAME: Optional[str] = None
    S3_UPLOAD_ENABLED: bool = True
    S3_PRESIGNED_URL_EXPIRATION_MINUTES: int = 60
    
    # Video Processing Configuration
    VIDEO_QUALITY_DEFAULT: str = "medium"
    VIDEO_FORMAT_DEFAULT: str = "mp4"

    # Security
    SECRET_KEY: Optional[str] = None

    # Environment
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()