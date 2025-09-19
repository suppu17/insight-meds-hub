from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
import os
from dotenv import load_dotenv

from app.api.endpoints import drug_analysis, market_research, health_analysis, redis_monitoring, medical_ocr, cache, auth
from app.middleware.auth_middleware import AuthMiddleware, auth_exception_handler
from app.core.config import settings

load_dotenv()

app = FastAPI(
    title="Insight Meds Hub API",
    description="AI-powered medication analysis and market intelligence API",
    version="1.0.0"
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8081", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure authentication middleware for protected routes
protected_paths = [
    "/api/v1/user",
    "/api/v1/protected",
    "/auth/me"
]

app.add_middleware(AuthMiddleware, protected_paths=protected_paths)

# Add exception handler for authentication errors
app.add_exception_handler(HTTPException, auth_exception_handler)

# Include API routers
app.include_router(auth.router, tags=["authentication"])
app.include_router(drug_analysis.router, prefix="/api/v1", tags=["drug-analysis"])
app.include_router(market_research.router, prefix="/api/v1", tags=["market-research"])
app.include_router(health_analysis.router, prefix="/api/v1", tags=["health-analysis"])
app.include_router(redis_monitoring.router, prefix="/api/v1", tags=["redis-monitoring"])
app.include_router(medical_ocr.router, prefix="/api/v1/medical-ocr", tags=["medical-ocr"])
app.include_router(cache.router, prefix="/api/v1/cache", tags=["cache"])

@app.get("/")
async def root():
    return {"message": "Insight Meds Hub API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )