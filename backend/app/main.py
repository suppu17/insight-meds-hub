from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import uvicorn
import os
from dotenv import load_dotenv

from app.api.endpoints import drug_analysis, market_research
from app.core.config import settings

load_dotenv()

app = FastAPI(
    title="Insight Meds Hub API",
    description="AI-powered medication analysis and market intelligence API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:8081", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(drug_analysis.router, prefix="/api/v1", tags=["drug-analysis"])
app.include_router(market_research.router, prefix="/api/v1", tags=["market-research"])

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