import type { VideoSegment } from './fal';

export interface VideoProcessingProgress {
  stage: 'downloading' | 'concatenating' | 'finalizing' | 'complete';
  progress: number; // 0-100
  message: string;
}

export interface CombinedVideoResult {
  videoBlob: Blob;
  duration: number;
  segments: VideoSegment[];
}

/**
 * Download video from URL as blob
 */
async function downloadVideoBlob(url: string): Promise<Blob> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'video/mp4,video/*',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Error downloading video:', error);
    throw new Error(`Failed to download video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a video element from blob
 */
function createVideoElement(blob: Blob): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;

    video.addEventListener('loadedmetadata', () => {
      resolve(video);
    });

    video.addEventListener('error', (e) => {
      reject(new Error(`Video loading error: ${e}`));
    });

    video.src = URL.createObjectURL(blob);
  });
}

/**
 * Concatenate video segments with timeout protection
 */
export async function concatenateVideoSegmentsWithTimeout(
  segments: VideoSegment[],
  onProgress?: (progress: VideoProcessingProgress) => void,
  timeoutMs: number = 30000
): Promise<CombinedVideoResult> {
  return Promise.race([
    concatenateVideoSegments(segments, onProgress),
    new Promise<CombinedVideoResult>((_, reject) =>
      setTimeout(() => reject(new Error('Video concatenation timeout - taking too long')), timeoutMs)
    )
  ]);
}

/**
 * Concatenate video segments using MediaRecorder API and Canvas
 */
export async function concatenateVideoSegments(
  segments: VideoSegment[],
  onProgress?: (progress: VideoProcessingProgress) => void
): Promise<CombinedVideoResult> {
  try {
    onProgress?.({
      stage: 'downloading',
      progress: 0,
      message: 'Downloading video segments...'
    });

    // Download all video blobs
    const videoBlobs: Blob[] = [];
    for (let i = 0; i < segments.length; i++) {
      const blob = await downloadVideoBlob(segments[i].videoUrl);
      videoBlobs.push(blob);

      onProgress?.({
        stage: 'downloading',
        progress: ((i + 1) / segments.length) * 40, // 40% for downloading
        message: `Downloaded segment ${i + 1}/${segments.length}`
      });
    }

    onProgress?.({
      stage: 'concatenating',
      progress: 40,
      message: 'Preparing video concatenation...'
    });

    // Create video elements
    const videoElements = await Promise.all(
      videoBlobs.map(blob => createVideoElement(blob))
    );

    // Set up canvas for recording
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Use dimensions from first video
    const firstVideo = videoElements[0];
    canvas.width = firstVideo.videoWidth || 1280;
    canvas.height = firstVideo.videoHeight || 720;

    // Set up MediaRecorder
    const stream = canvas.captureStream(30); // 30 FPS
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9'
    });

    const recordedChunks: Blob[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    const recordingPromise = new Promise<Blob>((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        resolve(blob);
      };

      mediaRecorder.onerror = (event) => {
        reject(new Error(`MediaRecorder error: ${event}`));
      };
    });

    onProgress?.({
      stage: 'concatenating',
      progress: 50,
      message: 'Starting video recording...'
    });

    // Start recording
    mediaRecorder.start();

    // Play and record each video segment
    for (let i = 0; i < videoElements.length; i++) {
      const video = videoElements[i];
      const segment = segments[i];

      onProgress?.({
        stage: 'concatenating',
        progress: 50 + (i / videoElements.length) * 40, // 40% for concatenation
        message: `Recording segment ${i + 1}/${videoElements.length}`
      });

      // Play video and draw frames to canvas
      await new Promise<void>((resolve, reject) => {
        let frameCount = 0;
        const targetFrames = Math.floor(segment.duration * 30); // 30 FPS

        const drawFrame = () => {
          if (frameCount >= targetFrames) {
            resolve();
            return;
          }

          // Clear canvas and draw current video frame
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          frameCount++;
          requestAnimationFrame(drawFrame);
        };

        video.addEventListener('loadeddata', () => {
          video.currentTime = 0;
          video.play().then(() => {
            drawFrame();
          }).catch(reject);
        });

        video.addEventListener('error', reject);
      });
    }

    onProgress?.({
      stage: 'finalizing',
      progress: 90,
      message: 'Finalizing video...'
    });

    // Stop recording
    mediaRecorder.stop();

    // Wait for recording to complete
    const finalBlob = await recordingPromise;

    // Clean up video elements
    videoElements.forEach(video => {
      URL.revokeObjectURL(video.src);
    });

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Video concatenation complete!'
    });

    // Calculate total duration
    const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);

    return {
      videoBlob: finalBlob,
      duration: totalDuration,
      segments
    };

  } catch (error) {
    console.error('Error concatenating videos:', error);
    throw new Error(`Failed to concatenate videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a virtual combined video result without actual concatenation
 * This allows users to access individual segments immediately
 */
export async function createVirtualCombinedVideo(
  segments: VideoSegment[],
  onProgress?: (progress: VideoProcessingProgress) => void
): Promise<CombinedVideoResult> {
  try {
    onProgress?.({
      stage: 'downloading',
      progress: 0,
      message: 'Preparing individual segments...'
    });

    // Create a minimal blob as placeholder for combined video
    const placeholderBlob = new Blob([''], { type: 'video/mp4' });

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Individual segments ready to play'
    });

    const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);

    return {
      videoBlob: placeholderBlob,
      duration: totalDuration,
      segments
    };

  } catch (error) {
    console.error('Error creating virtual combined video:', error);
    throw new Error(`Failed to prepare segments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Simple concatenation fallback using video elements (for development)
 */
export async function simpleConcatenateVideos(
  segments: VideoSegment[],
  onProgress?: (progress: VideoProcessingProgress) => void
): Promise<CombinedVideoResult> {
  try {
    onProgress?.({
      stage: 'downloading',
      progress: 0,
      message: 'Preparing video playback...'
    });

    // For development, we'll just use the first segment as a fallback
    // In production, you might want to use FFmpeg.wasm or similar
    const firstSegment = segments[0];
    const videoBlob = await downloadVideoBlob(firstSegment.videoUrl);

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Video ready for playback'
    });

    const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);

    return {
      videoBlob,
      duration: totalDuration,
      segments
    };

  } catch (error) {
    console.error('Error in simple concatenation:', error);
    throw new Error(`Failed to prepare video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get video duration from blob
 */
export function getVideoDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    });

    video.addEventListener('error', (e) => {
      URL.revokeObjectURL(video.src);
      reject(new Error(`Error loading video: ${e}`));
    });

    video.src = URL.createObjectURL(blob);
  });
}

/**
 * Create a video preview thumbnail
 */
export function createVideoThumbnail(blob: Blob, timeSeconds: number = 1): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    video.addEventListener('loadedmetadata', () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.currentTime = Math.min(timeSeconds, video.duration - 0.1);
    });

    video.addEventListener('seeked', () => {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(video.src);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail'));
          }
        },
        'image/jpeg',
        0.8
      );
    });

    video.addEventListener('error', (e) => {
      URL.revokeObjectURL(video.src);
      reject(new Error(`Video error: ${e}`));
    });

    video.src = URL.createObjectURL(blob);
  });
}