#!/usr/bin/env python3
"""
Simple video processing test server
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
import uvicorn
import sys
import os
from pathlib import Path

# Add the app directory to Python path
app_dir = Path(__file__).parent / "app"
sys.path.insert(0, str(app_dir))

try:
    from app.api.endpoints.video_processing import router as video_router
    print("✅ Video processing module imported successfully")
except Exception as e:
    print(f"❌ Failed to import video processing module: {e}")
    print("Will create a minimal endpoint for testing")

app = FastAPI(
    title="Video Processing Test API",
    description="Test API for video combining functionality",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8081", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Try to include the video processing router
try:
    app.include_router(video_router, prefix="/api/v1", tags=["video-processing"])
    print("✅ Video processing router added")
except Exception as e:
    print(f"❌ Failed to add video processing router: {e}")

    # Create minimal test endpoints
    @app.post("/api/v1/video/combine")
    async def test_combine_videos():
        return {
            "message": "Video processing endpoint placeholder",
            "status": "FFmpeg not available",
            "job_id": "test-123"
        }

@app.get("/")
async def root():
    return {"message": "Video Processing Test API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "video_processing": "available"}

if __name__ == "__main__":
    print("🎬 Starting Video Processing Test Server...")
    print("🌐 API will be available at:")
    print("   - Main API: http://localhost:8000")
    print("   - Documentation: http://localhost:8000/docs")
    print("   - Health Check: http://localhost:8000/health")
    print()

    uvicorn.run(
        "test_video_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )