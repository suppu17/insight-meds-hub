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
    REDIS_URL: str = "redis://localhost:6379"

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

    # Security
    SECRET_KEY: Optional[str] = None

    # Environment
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()