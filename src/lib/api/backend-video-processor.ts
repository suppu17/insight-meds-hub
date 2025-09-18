/**
 * Backend Video Processing Service
 *
 * Handles video combining using the Python backend API instead of client-side FFmpeg
 */

import type { VideoSegment } from './fal';

export interface BackendVideoSegment {
  url: string;
  duration: number;
  segment_number: number;
  format: string;
}

export interface CombineVideoRequest {
  segments: BackendVideoSegment[];
  output_format: 'mp4' | 'webm';
  quality: 'high' | 'medium' | 'low';
  drug_name?: string;
}

export interface VideoProcessingProgress {
  stage: string;
  progress: number; // 0-100
  message: string;
  segment_count?: number;
  current_segment?: number;
  estimated_remaining?: number;
}

export interface CombinedVideoResult {
  file_path: string;
  duration: number;
  size: number;
  format: string;
  quality: string;
  segments_count: number;
  created_at: string;
  expires_at?: string;
}

export interface VideoProcessingJobResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: VideoProcessingProgress;
  result?: CombinedVideoResult;
  error?: string;
  created_at: string;
}

export interface VideoInfo {
  duration: number;
  size: number;
  bitrate: number;
  video: {
    codec: string;
    width: number;
    height: number;
    fps: number;
  };
  audio?: {
    codec: string;
    channels: number;
    sample_rate: number;
  };
}

export class BackendVideoProcessor {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8001/api/v1') {
    this.baseUrl = baseUrl;
  }

  /**
   * Convert frontend VideoSegment to backend format
   */
  private convertSegments(segments: VideoSegment[]): BackendVideoSegment[] {
    return segments.map((segment, index) => ({
      url: segment.videoUrl,
      duration: segment.duration,
      segment_number: index + 1,
      format: 'mp4' // Assume MP4 for now
    }));
  }

  /**
   * Start video combining process
   */
  async combineVideos(
    segments: VideoSegment[],
    options: {
      format?: 'mp4' | 'webm';
      quality?: 'high' | 'medium' | 'low';
      drugName?: string;
    } = {}
  ): Promise<string> {
    const { format = 'mp4', quality = 'medium', drugName } = options;

    if (!segments || segments.length === 0) {
      throw new Error('No video segments provided');
    }

    // Validate that all segments have valid URLs
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (!segment.videoUrl || !segment.videoUrl.startsWith('http')) {
        throw new Error(`Invalid video URL for segment ${i + 1}: ${segment.videoUrl}`);
      }
    }

    const request: CombineVideoRequest = {
      segments: this.convertSegments(segments),
      output_format: format,
      quality,
      drug_name: drugName
    };

    try {
      const response = await fetch(`${this.baseUrl}/video/combine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const jobResponse: VideoProcessingJobResponse = await response.json();
      return jobResponse.job_id;

    } catch (error) {
      console.error('Failed to start video combining:', error);
      throw new Error(`Failed to start video combining: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get job status and progress
   */
  async getJobStatus(jobId: string): Promise<VideoProcessingJobResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/video/job/${jobId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Job not found');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Failed to get job status:', error);
      throw new Error(`Failed to get job status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download the combined video
   */
  async downloadVideo(jobId: string, filename?: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/video/download/${jobId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Video not found or job not completed');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Trigger download if filename is provided
      if (filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      return blob;

    } catch (error) {
      console.error('Failed to download video:', error);
      throw new Error(`Failed to download video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get video stream URL for playing
   */
  getVideoStreamUrl(jobId: string): string {
    return `${this.baseUrl}/video/stream/${jobId}`;
  }

  /**
   * Get video information
   */
  async getVideoInfo(jobId: string): Promise<VideoInfo> {
    try {
      const response = await fetch(`${this.baseUrl}/video/info/${jobId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Video not found or job not completed');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Failed to get video info:', error);
      throw new Error(`Failed to get video info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a processing job and its files
   */
  async deleteJob(jobId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/video/job/${jobId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Job already doesn't exist, that's fine
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      console.error('Failed to delete job:', error);
      throw new Error(`Failed to delete job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Wait for job completion with progress updates
   */
  async waitForCompletion(
    jobId: string,
    onProgress?: (progress: VideoProcessingProgress) => void,
    pollInterval: number = 2000, // Increased polling interval to reduce server load
    timeout: number = 180000 // Reduced to 3 minutes for faster fallback
  ): Promise<CombinedVideoResult> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          // Check timeout
          if (Date.now() - startTime > timeout) {
            reject(new Error('Video processing timeout'));
            return;
          }

          const jobStatus = await this.getJobStatus(jobId);

          // Update progress
          if (jobStatus.progress && onProgress) {
            onProgress(jobStatus.progress);
          }

          // Check completion
          if (jobStatus.status === 'completed') {
            if (jobStatus.result) {
              resolve(jobStatus.result);
              return;
            } else {
              reject(new Error('Job completed but no result available'));
              return;
            }
          }

          // Check failure
          if (jobStatus.status === 'failed') {
            reject(new Error(jobStatus.error || 'Video processing failed'));
            return;
          }

          // Continue polling
          setTimeout(poll, pollInterval);

        } catch (error) {
          reject(error);
        }
      };

      // Start polling
      poll();
    });
  }

  /**
   * Complete video combining workflow with progress tracking
   */
  async combineAndWait(
    segments: VideoSegment[],
    options: {
      format?: 'mp4' | 'webm';
      quality?: 'high' | 'medium' | 'low';
      drugName?: string;
      onProgress?: (progress: VideoProcessingProgress) => void;
      pollInterval?: number;
      timeout?: number;
    } = {}
  ): Promise<{
    jobId: string;
    result: CombinedVideoResult;
    videoBlob: Blob;
    streamUrl: string;
  }> {
    const {
      format = 'mp4',
      quality = 'medium',
      drugName,
      onProgress,
      pollInterval = 1000,
      timeout = 300000
    } = options;

    try {
      // Start combining
      const jobId = await this.combineVideos(segments, { format, quality, drugName });

      // Wait for completion
      const result = await this.waitForCompletion(jobId, onProgress, pollInterval, timeout);

      // Download the video blob
      const videoBlob = await this.downloadVideo(jobId);

      // Get stream URL
      const streamUrl = this.getVideoStreamUrl(jobId);

      return {
        jobId,
        result,
        videoBlob,
        streamUrl
      };

    } catch (error) {
      console.error('Complete video combining workflow failed:', error);
      throw error;
    }
  }
}

// Singleton instance
let backendVideoProcessor: BackendVideoProcessor | null = null;

/**
 * Get or create backend video processor singleton
 */
export function getBackendVideoProcessor(): BackendVideoProcessor {
  if (!backendVideoProcessor) {
    backendVideoProcessor = new BackendVideoProcessor();
  }
  return backendVideoProcessor;
}

/**
 * Simple wrapper for video combining
 */
export async function combineVideosWithBackend(
  segments: VideoSegment[],
  options: {
    format?: 'mp4' | 'webm';
    quality?: 'high' | 'medium' | 'low';
    drugName?: string;
    onProgress?: (progress: VideoProcessingProgress) => void;
  } = {}
): Promise<{
  jobId: string;
  videoBlob: Blob;
  streamUrl: string;
  duration: number;
  size: number;
}> {
  const processor = getBackendVideoProcessor();
  const result = await processor.combineAndWait(segments, options);

  return {
    jobId: result.jobId,
    videoBlob: result.videoBlob,
    streamUrl: result.streamUrl,
    duration: result.result.duration,
    size: result.result.size
  };
}