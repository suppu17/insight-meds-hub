#!/usr/bin/env python3
"""
Simple mock video processing server for testing
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
import time
from datetime import datetime
import uvicorn

app = FastAPI(
    title="Mock Video Processing API",
    description="Mock API for testing video combining functionality",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:8081", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data structures
class VideoSegment(BaseModel):
    url: str
    duration: float
    segment_number: int
    format: str = "mp4"

class CombineVideoRequest(BaseModel):
    segments: List[VideoSegment]
    output_format: str = "mp4"
    quality: str = "medium"
    drug_name: Optional[str] = None

class VideoProcessingProgress(BaseModel):
    stage: str
    progress: float
    message: str
    segment_count: Optional[int] = None
    current_segment: Optional[int] = None

class CombinedVideoResult(BaseModel):
    file_path: str
    duration: float
    size: int
    format: str
    quality: str
    segments_count: int
    created_at: str

class VideoProcessingJobResponse(BaseModel):
    job_id: str
    status: str
    progress: Optional[VideoProcessingProgress] = None
    result: Optional[CombinedVideoResult] = None
    error: Optional[str] = None
    created_at: str

# Mock job storage
mock_jobs: Dict[str, Dict[str, Any]] = {}

@app.post("/api/v1/video/combine", response_model=VideoProcessingJobResponse)
async def combine_videos(request: CombineVideoRequest):
    """Mock video combining endpoint"""

    # Validate request
    if not request.segments:
        return VideoProcessingJobResponse(
            job_id="",
            status="failed",
            error="No video segments provided",
            created_at=datetime.now().isoformat()
        )

    # Create mock job
    job_id = str(uuid.uuid4())

    mock_jobs[job_id] = {
        "job_id": job_id,
        "status": "pending",
        "created_at": datetime.now().isoformat(),
        "request": request.dict(),
        "start_time": time.time(),
        "progress": VideoProcessingProgress(
            stage="downloading",
            progress=0.0,
            message="Starting video processing...",
            segment_count=len(request.segments)
        ).dict()
    }

    print(f"🎬 Created mock video combining job: {job_id}")
    print(f"   - Segments: {len(request.segments)}")
    print(f"   - Format: {request.output_format}")
    print(f"   - Quality: {request.quality}")
    print(f"   - Drug: {request.drug_name}")

    return VideoProcessingJobResponse(
        job_id=job_id,
        status="pending",
        progress=mock_jobs[job_id]["progress"],
        created_at=mock_jobs[job_id]["created_at"]
    )

@app.get("/api/v1/video/job/{job_id}", response_model=VideoProcessingJobResponse)
async def get_job_status(job_id: str):
    """Mock job status endpoint"""

    if job_id not in mock_jobs:
        return VideoProcessingJobResponse(
            job_id=job_id,
            status="failed",
            error="Job not found",
            created_at=datetime.now().isoformat()
        )

    job = mock_jobs[job_id]
    elapsed_time = time.time() - job["start_time"]

    # Simulate progress over time
    if job["status"] == "pending" and elapsed_time > 1:
        job["status"] = "processing"
        job["progress"] = VideoProcessingProgress(
            stage="downloading",
            progress=20.0,
            message="Downloading video segments...",
            segment_count=len(job["request"]["segments"])
        ).dict()

    elif job["status"] == "processing" and elapsed_time > 3:
        job["progress"] = VideoProcessingProgress(
            stage="combining",
            progress=60.0,
            message="Combining video segments...",
            segment_count=len(job["request"]["segments"])
        ).dict()

    elif job["status"] == "processing" and elapsed_time > 6:
        # Complete the job
        request_data = job["request"]
        total_duration = sum(seg["duration"] for seg in request_data["segments"])

        job["status"] = "completed"
        job["result"] = CombinedVideoResult(
            file_path=f"/tmp/combined_{job_id}.{request_data['output_format']}",
            duration=total_duration,
            size=1024 * 1024 * 5,  # 5MB mock size
            format=request_data["output_format"],
            quality=request_data["quality"],
            segments_count=len(request_data["segments"]),
            created_at=job["created_at"]
        ).dict()

        job["progress"] = VideoProcessingProgress(
            stage="complete",
            progress=100.0,
            message="Video combination complete!",
            segment_count=len(request_data["segments"])
        ).dict()

        print(f"✅ Mock job {job_id} completed successfully")

    return VideoProcessingJobResponse(
        job_id=job_id,
        status=job["status"],
        progress=job.get("progress"),
        result=job.get("result"),
        error=job.get("error"),
        created_at=job["created_at"]
    )

@app.get("/api/v1/video/download/{job_id}")
async def download_video(job_id: str):
    """Mock video download endpoint"""

    if job_id not in mock_jobs:
        return {"error": "Job not found"}

    job = mock_jobs[job_id]

    if job["status"] != "completed":
        return {"error": "Job not completed yet"}

    # Return mock video data
    mock_video_content = b"MOCK_VIDEO_CONTENT_" + job_id.encode()

    from fastapi.responses import Response
    return Response(
        content=mock_video_content,
        media_type="video/mp4",
        headers={
            "Content-Disposition": f"attachment; filename=combined_{job_id}.mp4",
            "Content-Length": str(len(mock_video_content))
        }
    )

@app.get("/api/v1/video/stream/{job_id}")
async def stream_video(job_id: str):
    """Mock video stream endpoint"""

    if job_id not in mock_jobs:
        return {"error": "Job not found"}

    job = mock_jobs[job_id]

    if job["status"] != "completed":
        return {"error": "Job not completed yet"}

    # Return mock stream URL
    return {"stream_url": f"http://localhost:8000/api/v1/video/download/{job_id}"}

@app.get("/")
async def root():
    return {
        "message": "Mock Video Processing API",
        "version": "1.0.0",
        "status": "running",
        "active_jobs": len(mock_jobs)
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "video_processing": "mock_available",
        "ffmpeg": "not_required_for_mock",
        "active_jobs": len(mock_jobs)
    }

@app.get("/api/v1/video/jobs")
async def list_jobs():
    """List all mock jobs"""
    jobs = []
    for job_id, job_data in mock_jobs.items():
        jobs.append(VideoProcessingJobResponse(
            job_id=job_id,
            status=job_data["status"],
            progress=job_data.get("progress"),
            result=job_data.get("result"),
            error=job_data.get("error"),
            created_at=job_data["created_at"]
        ))

    return {"jobs": jobs, "total": len(jobs)}

if __name__ == "__main__":
    print("🎬 Starting Mock Video Processing Server...")
    print("📝 This is a mock server for testing the API integration")
    print("🌐 API will be available at:")
    print("   - Main API: http://localhost:8001")
    print("   - Documentation: http://localhost:8001/docs")
    print("   - Health Check: http://localhost:8001/health")
    print("   - Jobs List: http://localhost:8001/api/v1/video/jobs")
    print()

    uvicorn.run(
        "simple_video_server:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )