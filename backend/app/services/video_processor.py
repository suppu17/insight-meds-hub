"""
Video Processing Service

Handles video combining, conversion, and processing operations using FFmpeg
"""

import os
import tempfile
import uuid
from pathlib import Path
from typing import List, Optional, Callable, Dict, Any
import asyncio
import aiofiles
import httpx
from datetime import datetime, timedelta
import subprocess
import ffmpeg
from moviepy.editor import VideoFileClip, concatenate_videoclips

from pydantic import BaseModel


class VideoSegment(BaseModel):
    """Video segment data structure"""
    url: str
    duration: float
    segment_number: int
    format: str = "mp4"


class CombineVideoRequest(BaseModel):
    """Request model for video combining"""
    segments: List[VideoSegment]
    output_format: str = "mp4"
    quality: str = "medium"
    drug_name: Optional[str] = None


class VideoProcessingProgress(BaseModel):
    """Progress tracking for video processing"""
    stage: str
    progress: float  # 0-100
    message: str
    segment_count: Optional[int] = None
    current_segment: Optional[int] = None
    estimated_remaining: Optional[int] = None


class CombinedVideoResult(BaseModel):
    """Result of video combining operation"""
    file_path: str
    duration: float
    size: int
    format: str
    quality: str
    segments_count: int
    created_at: datetime
    expires_at: Optional[datetime] = None


class VideoProcessingError(Exception):
    """Custom exception for video processing errors"""
    pass


class VideoProcessor:
    """Main video processing service"""

    def __init__(self, temp_dir: Optional[str] = None):
        self.temp_dir = temp_dir or tempfile.gettempdir()
        self.processed_videos_dir = Path(self.temp_dir) / "processed_videos"
        self.processed_videos_dir.mkdir(exist_ok=True)

        # Video cleanup after 24 hours
        self.video_expiry_hours = 24

    async def download_video_segment(self, url: str, output_path: str) -> None:
        """Download a video segment from URL"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                async with client.stream("GET", url) as response:
                    if response.status_code != 200:
                        raise VideoProcessingError(f"Failed to download video: {response.status_code}")

                    async with aiofiles.open(output_path, "wb") as f:
                        async for chunk in response.aiter_bytes(8192):
                            await f.write(chunk)

        except httpx.TimeoutException:
            raise VideoProcessingError("Video download timed out")
        except Exception as e:
            raise VideoProcessingError(f"Failed to download video: {str(e)}")

    async def combine_videos_ffmpeg(
        self,
        request: CombineVideoRequest,
        progress_callback: Optional[Callable[[VideoProcessingProgress], None]] = None
    ) -> CombinedVideoResult:
        """Combine video segments using FFmpeg"""

        job_id = str(uuid.uuid4())
        temp_dir = Path(self.temp_dir) / f"video_job_{job_id}"
        temp_dir.mkdir(exist_ok=True)

        try:
            if progress_callback:
                progress_callback(VideoProcessingProgress(
                    stage="downloading",
                    progress=0.0,
                    message="Starting video download...",
                    segment_count=len(request.segments)
                ))

            # Download all segments
            segment_files = []
            for i, segment in enumerate(request.segments):
                segment_path = temp_dir / f"segment_{i:02d}.{segment.format}"

                if progress_callback:
                    progress_callback(VideoProcessingProgress(
                        stage="downloading",
                        progress=(i / len(request.segments)) * 30,
                        message=f"Downloading segment {i + 1}/{len(request.segments)}...",
                        current_segment=i + 1,
                        segment_count=len(request.segments)
                    ))

                await self.download_video_segment(segment.url, str(segment_path))
                segment_files.append(segment_path)

            if progress_callback:
                progress_callback(VideoProcessingProgress(
                    stage="combining",
                    progress=30.0,
                    message="Preparing video combination...",
                    segment_count=len(request.segments)
                ))

            # Create concat file for FFmpeg
            concat_file = temp_dir / "concat_list.txt"
            with open(concat_file, "w") as f:
                for segment_file in segment_files:
                    f.write(f"file '{segment_file.absolute()}'\n")

            # Output file
            output_filename = f"combined_{job_id}.{request.output_format}"
            output_path = self.processed_videos_dir / output_filename

            if progress_callback:
                progress_callback(VideoProcessingProgress(
                    stage="combining",
                    progress=40.0,
                    message="Running FFmpeg concatenation...",
                    segment_count=len(request.segments)
                ))

            # Build FFmpeg command
            quality_settings = self._get_ffmpeg_quality_settings(request.quality, request.output_format)

            # Use ffmpeg-python for better control
            input_stream = ffmpeg.input(str(concat_file), f="concat", safe=0)

            if request.output_format == "mp4":
                output_stream = ffmpeg.output(
                    input_stream,
                    str(output_path),
                    vcodec="libx264",
                    acodec="aac",
                    movflags="+faststart",
                    **quality_settings
                )
            else:  # webm
                output_stream = ffmpeg.output(
                    input_stream,
                    str(output_path),
                    vcodec="libvpx-vp9",
                    acodec="libopus",
                    **quality_settings
                )

            # Run FFmpeg
            try:
                ffmpeg.run(output_stream, overwrite_output=True, quiet=True)
            except ffmpeg.Error as e:
                raise VideoProcessingError(f"FFmpeg processing failed: {e}")

            if progress_callback:
                progress_callback(VideoProcessingProgress(
                    stage="finalizing",
                    progress=90.0,
                    message="Finalizing combined video...",
                    segment_count=len(request.segments)
                ))

            # Get video info
            probe = ffmpeg.probe(str(output_path))
            duration = float(probe['streams'][0]['duration'])
            file_size = output_path.stat().st_size

            # Create result
            result = CombinedVideoResult(
                file_path=str(output_path),
                duration=duration,
                size=file_size,
                format=request.output_format,
                quality=request.quality,
                segments_count=len(request.segments),
                created_at=datetime.now(),
                expires_at=datetime.now() + timedelta(hours=self.video_expiry_hours)
            )

            if progress_callback:
                progress_callback(VideoProcessingProgress(
                    stage="complete",
                    progress=100.0,
                    message=f"Video combination complete! Duration: {duration:.1f}s",
                    segment_count=len(request.segments)
                ))

            return result

        except Exception as e:
            raise VideoProcessingError(f"Video combination failed: {str(e)}")
        finally:
            # Cleanup temp directory
            try:
                import shutil
                shutil.rmtree(temp_dir)
            except Exception as e:
                print(f"Warning: Failed to cleanup temp directory {temp_dir}: {e}")

    async def combine_videos_moviepy(
        self,
        request: CombineVideoRequest,
        progress_callback: Optional[Callable[[VideoProcessingProgress], None]] = None
    ) -> CombinedVideoResult:
        """Combine video segments using MoviePy (fallback method)"""

        job_id = str(uuid.uuid4())
        temp_dir = Path(self.temp_dir) / f"video_job_{job_id}"
        temp_dir.mkdir(exist_ok=True)

        try:
            if progress_callback:
                progress_callback(VideoProcessingProgress(
                    stage="downloading",
                    progress=0.0,
                    message="Starting video download...",
                    segment_count=len(request.segments)
                ))

            # Download all segments
            segment_files = []
            for i, segment in enumerate(request.segments):
                segment_path = temp_dir / f"segment_{i:02d}.{segment.format}"

                if progress_callback:
                    progress_callback(VideoProcessingProgress(
                        stage="downloading",
                        progress=(i / len(request.segments)) * 40,
                        message=f"Downloading segment {i + 1}/{len(request.segments)}...",
                        current_segment=i + 1,
                        segment_count=len(request.segments)
                    ))

                await self.download_video_segment(segment.url, str(segment_path))
                segment_files.append(segment_path)

            if progress_callback:
                progress_callback(VideoProcessingProgress(
                    stage="combining",
                    progress=40.0,
                    message="Loading video clips...",
                    segment_count=len(request.segments)
                ))

            # Load video clips
            clips = []
            for i, segment_file in enumerate(segment_files):
                clip = VideoFileClip(str(segment_file))
                clips.append(clip)

                if progress_callback:
                    progress_callback(VideoProcessingProgress(
                        stage="combining",
                        progress=40.0 + (i / len(segment_files)) * 20,
                        message=f"Loaded clip {i + 1}/{len(segment_files)}...",
                        current_segment=i + 1,
                        segment_count=len(request.segments)
                    ))

            if progress_callback:
                progress_callback(VideoProcessingProgress(
                    stage="combining",
                    progress=60.0,
                    message="Concatenating video clips...",
                    segment_count=len(request.segments)
                ))

            # Concatenate clips
            final_clip = concatenate_videoclips(clips)

            # Output file
            output_filename = f"combined_{job_id}.{request.output_format}"
            output_path = self.processed_videos_dir / output_filename

            if progress_callback:
                progress_callback(VideoProcessingProgress(
                    stage="exporting",
                    progress=70.0,
                    message="Exporting combined video...",
                    segment_count=len(request.segments)
                ))

            # Export video
            if request.output_format == "mp4":
                final_clip.write_videofile(
                    str(output_path),
                    codec='libx264',
                    audio_codec='aac',
                    verbose=False,
                    logger=None
                )
            else:  # webm
                final_clip.write_videofile(
                    str(output_path),
                    codec='libvpx',
                    audio_codec='libvorbis',
                    verbose=False,
                    logger=None
                )

            # Clean up clips
            for clip in clips:
                clip.close()
            final_clip.close()

            # Get video info
            file_size = output_path.stat().st_size
            duration = sum(segment.duration for segment in request.segments)

            result = CombinedVideoResult(
                file_path=str(output_path),
                duration=duration,
                size=file_size,
                format=request.output_format,
                quality=request.quality,
                segments_count=len(request.segments),
                created_at=datetime.now(),
                expires_at=datetime.now() + timedelta(hours=self.video_expiry_hours)
            )

            if progress_callback:
                progress_callback(VideoProcessingProgress(
                    stage="complete",
                    progress=100.0,
                    message=f"Video combination complete! Duration: {duration:.1f}s",
                    segment_count=len(request.segments)
                ))

            return result

        except Exception as e:
            raise VideoProcessingError(f"MoviePy video combination failed: {str(e)}")
        finally:
            # Cleanup temp directory
            try:
                import shutil
                shutil.rmtree(temp_dir)
            except Exception as e:
                print(f"Warning: Failed to cleanup temp directory {temp_dir}: {e}")

    def _get_ffmpeg_quality_settings(self, quality: str, format: str) -> Dict[str, Any]:
        """Get FFmpeg quality settings based on quality level and format"""

        if format == "mp4":
            if quality == "high":
                return {"preset": "medium", "crf": 20, "profile:v": "high", "level": "4.0"}
            elif quality == "medium":
                return {"preset": "fast", "crf": 23, "profile:v": "main"}
            else:  # low
                return {"preset": "fast", "crf": 28, "profile:v": "baseline"}
        else:  # webm
            if quality == "high":
                return {"deadline": "good", "cpu-used": 2, "crf": 20, "b:v": "2M"}
            elif quality == "medium":
                return {"deadline": "good", "cpu-used": 3, "crf": 25, "b:v": "1M"}
            else:  # low
                return {"deadline": "realtime", "cpu-used": 4, "crf": 30, "b:v": "500k"}

    async def cleanup_expired_videos(self) -> int:
        """Clean up expired video files"""
        cleaned = 0
        now = datetime.now()

        for video_file in self.processed_videos_dir.glob("combined_*.mp4"):
            try:
                # Check file creation time
                file_stat = video_file.stat()
                created_time = datetime.fromtimestamp(file_stat.st_ctime)

                if now - created_time > timedelta(hours=self.video_expiry_hours):
                    video_file.unlink()
                    cleaned += 1
            except Exception as e:
                print(f"Warning: Failed to cleanup video file {video_file}: {e}")

        for video_file in self.processed_videos_dir.glob("combined_*.webm"):
            try:
                # Check file creation time
                file_stat = video_file.stat()
                created_time = datetime.fromtimestamp(file_stat.st_ctime)

                if now - created_time > timedelta(hours=self.video_expiry_hours):
                    video_file.unlink()
                    cleaned += 1
            except Exception as e:
                print(f"Warning: Failed to cleanup video file {video_file}: {e}")

        return cleaned

    def get_video_info(self, file_path: str) -> Dict[str, Any]:
        """Get video file information"""
        try:
            probe = ffmpeg.probe(file_path)
            video_stream = next(stream for stream in probe['streams'] if stream['codec_type'] == 'video')
            audio_stream = next((stream for stream in probe['streams'] if stream['codec_type'] == 'audio'), None)

            return {
                "duration": float(probe['format']['duration']),
                "size": int(probe['format']['size']),
                "bitrate": int(probe['format']['bit_rate']),
                "video": {
                    "codec": video_stream['codec_name'],
                    "width": int(video_stream['width']),
                    "height": int(video_stream['height']),
                    "fps": eval(video_stream['r_frame_rate']),
                },
                "audio": {
                    "codec": audio_stream['codec_name'] if audio_stream else None,
                    "channels": int(audio_stream['channels']) if audio_stream else None,
                    "sample_rate": int(audio_stream['sample_rate']) if audio_stream else None,
                } if audio_stream else None
            }
        except Exception as e:
            raise VideoProcessingError(f"Failed to get video info: {str(e)}")


# Singleton instance
_video_processor = None


def get_video_processor() -> VideoProcessor:
    """Get or create video processor singleton"""
    global _video_processor
    if _video_processor is None:
        _video_processor = VideoProcessor()
    return _video_processor