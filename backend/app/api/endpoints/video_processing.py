"""
Video Processing API Endpoints

Handles video combining, conversion, and download operations
"""

import asyncio
import uuid
from pathlib import Path
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query, Request
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field

from app.services.video_processor import (
    get_video_processor,
    CombineVideoRequest,
    VideoProcessingProgress,
    VideoProcessingError,
    CombinedVideoResult,
)

router = APIRouter()

# Store for tracking processing jobs
processing_jobs: Dict[str, Dict[str, Any]] = {}


class VideoProcessingJobResponse(BaseModel):
    """Response model for video processing jobs"""
    job_id: str
    status: str  # "processing", "completed", "failed"
    progress: Optional[VideoProcessingProgress] = None
    result: Optional[CombinedVideoResult] = None
    error: Optional[str] = None
    created_at: str


class VideoInfoResponse(BaseModel):
    """Response model for video information"""
    duration: float
    size: int
    bitrate: int
    video: Dict[str, Any]
    audio: Optional[Dict[str, Any]]


async def process_video_job(job_id: str, request: CombineVideoRequest):
    """Background task to process video combining"""
    processor = get_video_processor()

    def update_progress(progress: VideoProcessingProgress):
        """Update job progress"""
        if job_id in processing_jobs:
            processing_jobs[job_id]["progress"] = progress

    try:
        processing_jobs[job_id]["status"] = "processing"

        # Try FFmpeg first, fallback to MoviePy
        try:
            result = await processor.combine_videos_ffmpeg(request, update_progress)
        except VideoProcessingError as e:
            print(f"FFmpeg failed, trying MoviePy: {e}")
            result = await processor.combine_videos_moviepy(request, update_progress)

        processing_jobs[job_id].update({
            "status": "completed",
            "result": result,
            "progress": VideoProcessingProgress(
                stage="complete",
                progress=100.0,
                message="Video processing completed successfully!"
            )
        })

    except Exception as e:
        processing_jobs[job_id].update({
            "status": "failed",
            "error": str(e),
            "progress": VideoProcessingProgress(
                stage="error",
                progress=0.0,
                message=f"Processing failed: {str(e)}"
            )
        })


@router.post("/video/combine", response_model=VideoProcessingJobResponse)
async def combine_videos(
    request: CombineVideoRequest,
    background_tasks: BackgroundTasks
):
    """
    Start video combining process

    Combines multiple video segments into a single video file.
    Returns a job ID that can be used to track progress.
    """
    try:
        if not request.segments:
            raise HTTPException(status_code=400, detail="No video segments provided")

        if len(request.segments) > 20:
            raise HTTPException(status_code=400, detail="Too many segments (max 20)")

        # Validate segments
        for i, segment in enumerate(request.segments):
            if not segment.url or not segment.url.startswith(('http://', 'https://')):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid URL for segment {i + 1}: {segment.url}"
                )

        # Create processing job
        job_id = str(uuid.uuid4())

        processing_jobs[job_id] = {
            "job_id": job_id,
            "status": "pending",
            "created_at": datetime.now().isoformat(),
            "request": request,
            "progress": None,
            "result": None,
            "error": None
        }

        # Start background processing
        background_tasks.add_task(process_video_job, job_id, request)

        return VideoProcessingJobResponse(
            job_id=job_id,
            status="pending",
            created_at=processing_jobs[job_id]["created_at"]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start video processing: {str(e)}")


@router.get("/video/job/{job_id}", response_model=VideoProcessingJobResponse)
async def get_job_status(job_id: str):
    """
    Get video processing job status and progress

    Returns the current status, progress, and result (if completed) of a video processing job.
    """
    if job_id not in processing_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = processing_jobs[job_id]

    return VideoProcessingJobResponse(
        job_id=job_id,
        status=job["status"],
        progress=job.get("progress"),
        result=job.get("result"),
        error=job.get("error"),
        created_at=job["created_at"]
    )


@router.get("/video/download/{job_id}")
async def download_video(job_id: str):
    """
    Download the combined video file

    Downloads the processed video file. Only available after job completion.
    """
    if job_id not in processing_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = processing_jobs[job_id]

    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")

    if not job.get("result"):
        raise HTTPException(status_code=500, detail="No result available")

    result = job["result"]
    file_path = Path(result.file_path)

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")

    # Determine content type
    content_type = "video/mp4" if result.format == "mp4" else "video/webm"

    # Generate filename
    drug_name = getattr(job.get("request"), "drug_name", "video")
    if drug_name:
        filename = f"{drug_name}_combined.{result.format}"
    else:
        filename = f"combined_video.{result.format}"

    return FileResponse(
        path=str(file_path),
        media_type=content_type,
        filename=filename,
        headers={
            "Content-Length": str(result.size),
            "Cache-Control": "no-cache"
        }
    )


@router.get("/video/stream/{job_id}")
async def stream_video(job_id: str, request: Request):
    """
    Stream the combined video file

    Streams the processed video with support for range requests (seeking).
    """
    if job_id not in processing_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = processing_jobs[job_id]

    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")

    if not job.get("result"):
        raise HTTPException(status_code=500, detail="No result available")

    result = job["result"]
    file_path = Path(result.file_path)

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found")

    # Handle range requests for video streaming
    range_header = request.headers.get('range')

    file_size = result.size
    content_type = "video/mp4" if result.format == "mp4" else "video/webm"

    if range_header:
        # Parse range header
        range_match = range_header.replace('bytes=', '').split('-')
        start = int(range_match[0]) if range_match[0] else 0
        end = int(range_match[1]) if range_match[1] else file_size - 1

        chunk_size = end - start + 1

        def iter_file():
            with open(file_path, 'rb') as f:
                f.seek(start)
                remaining = chunk_size
                while remaining:
                    chunk = f.read(min(8192, remaining))
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk

        headers = {
            'Content-Range': f'bytes {start}-{end}/{file_size}',
            'Accept-Ranges': 'bytes',
            'Content-Length': str(chunk_size),
            'Content-Type': content_type,
        }

        return StreamingResponse(
            iter_file(),
            status_code=206,
            headers=headers
        )
    else:
        # Return full file
        def iter_file():
            with open(file_path, 'rb') as f:
                while chunk := f.read(8192):
                    yield chunk

        headers = {
            'Content-Length': str(file_size),
            'Content-Type': content_type,
            'Accept-Ranges': 'bytes'
        }

        return StreamingResponse(iter_file(), headers=headers)


@router.get("/video/info/{job_id}", response_model=VideoInfoResponse)
async def get_video_info(job_id: str):
    """
    Get detailed information about the processed video

    Returns technical details about the combined video file.
    """
    if job_id not in processing_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = processing_jobs[job_id]

    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job not completed yet")

    if not job.get("result"):
        raise HTTPException(status_code=500, detail="No result available")

    result = job["result"]
    file_path = result.file_path

    try:
        processor = get_video_processor()
        video_info = processor.get_video_info(file_path)

        return VideoInfoResponse(**video_info)

    except VideoProcessingError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/video/job/{job_id}")
async def delete_job(job_id: str):
    """
    Delete a video processing job and its files

    Removes the job from memory and deletes the associated video file.
    """
    if job_id not in processing_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = processing_jobs[job_id]

    # Delete video file if it exists
    if job.get("result") and job["result"].file_path:
        try:
            file_path = Path(job["result"].file_path)
            if file_path.exists():
                file_path.unlink()
        except Exception as e:
            print(f"Warning: Failed to delete video file: {e}")

    # Remove job from memory
    del processing_jobs[job_id]

    return {"message": "Job deleted successfully"}


@router.get("/video/jobs")
async def list_jobs(
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, description="Maximum number of jobs to return")
):
    """
    List video processing jobs

    Returns a list of recent video processing jobs with their current status.
    """
    jobs = []

    for job_id, job_data in list(processing_jobs.items())[-limit:]:
        if status and job_data["status"] != status:
            continue

        jobs.append(VideoProcessingJobResponse(
            job_id=job_id,
            status=job_data["status"],
            progress=job_data.get("progress"),
            result=job_data.get("result"),
            error=job_data.get("error"),
            created_at=job_data["created_at"]
        ))

    return {"jobs": jobs, "total": len(jobs)}


@router.post("/video/cleanup")
async def cleanup_old_jobs():
    """
    Clean up old video processing jobs and files

    Removes expired video files and completed jobs older than 24 hours.
    """
    try:
        processor = get_video_processor()
        cleaned_files = await processor.cleanup_expired_videos()

        # Clean up old jobs from memory (keep only recent ones)
        from datetime import datetime, timedelta
        cutoff_time = datetime.now() - timedelta(hours=24)

        jobs_to_remove = []
        for job_id, job_data in processing_jobs.items():
            try:
                created_time = datetime.fromisoformat(job_data["created_at"])
                if created_time < cutoff_time:
                    jobs_to_remove.append(job_id)
            except Exception:
                # Remove jobs with invalid timestamps
                jobs_to_remove.append(job_id)

        cleaned_jobs = len(jobs_to_remove)
        for job_id in jobs_to_remove:
            del processing_jobs[job_id]

        return {
            "message": "Cleanup completed",
            "cleaned_files": cleaned_files,
            "cleaned_jobs": cleaned_jobs
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")


# Import datetime at the top of the file
from datetime import datetime