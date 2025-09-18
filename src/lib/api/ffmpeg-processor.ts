import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { VideoSegment } from './fal';

export interface FFmpegProcessingProgress {
  stage: 'initializing' | 'loading_segments' | 'concatenating' | 'finalizing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  timeElapsed?: number;
  estimatedRemaining?: number;
}

export interface CombinedVideoResult {
  videoBlob: Blob;
  duration: number;
  segments: VideoSegment[];
  format: 'mp4' | 'webm';
  size: number;
  quality: 'high' | 'medium' | 'low';
}

export class FFmpegVideoProcessor {
  private ffmpeg: FFmpeg;
  private isLoaded = false;
  private isLoading = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // FFmpeg progress and logging
    this.ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });

    this.ffmpeg.on('progress', ({ progress, time }) => {
      console.log(`[FFmpeg] Progress: ${(progress * 100).toFixed(1)}% (${time}μs)`);
    });
  }

  /**
   * Get FFmpeg core URLs with fallback CDNs
   */
  private getFFmpegCoreUrls(version: string = '0.12.6') {
    return [
      // Updated working CDN sources
      {
        name: 'unpkg-0.12.6',
        baseURL: `https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm`
      },
      {
        name: 'unpkg-0.12.4',
        baseURL: `https://unpkg.com/@ffmpeg/core@0.12.4/dist/esm`
      },
      {
        name: 'jsdelivr-0.12.6',
        baseURL: `https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm`
      },
      {
        name: 'jsdelivr-0.12.4',
        baseURL: `https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.4/dist/esm`
      },
      // Fallback to UMD if ESM fails
      {
        name: 'unpkg-umd-0.12.6',
        baseURL: `https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd`
      }
    ];
  }

  /**
   * Try to load FFmpeg core files from multiple CDN sources
   */
  private async loadFFmpegCoreWithFallback(onProgress?: (progress: FFmpegProcessingProgress) => void): Promise<{
    coreURL: string;
    wasmURL: string;
    workerURL: string;
  }> {
    const cdnSources = this.getFFmpegCoreUrls();

    for (let i = 0; i < cdnSources.length; i++) {
      const source = cdnSources[i];

      try {
        onProgress?.({
          stage: 'initializing',
          progress: 10 + (i * 20),
          message: `Trying ${source.name} CDN...`
        });

        console.log(`[FFmpeg] Attempting to load from ${source.name}: ${source.baseURL}`);

        const coreURL = await toBlobURL(`${source.baseURL}/ffmpeg-core.js`, 'text/javascript');
        const wasmURL = await toBlobURL(`${source.baseURL}/ffmpeg-core.wasm`, 'application/wasm');
        const workerURL = await toBlobURL(`${source.baseURL}/ffmpeg-core.worker.js`, 'text/javascript');

        console.log(`[FFmpeg] Successfully loaded from ${source.name}`);
        return { coreURL, wasmURL, workerURL };

      } catch (error) {
        console.warn(`[FFmpeg] Failed to load from ${source.name}:`, error);

        if (i === cdnSources.length - 1) {
          throw new Error(`All CDN sources failed. Last error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        // Continue to next CDN
      }
    }

    throw new Error('All FFmpeg CDN sources failed');
  }

  /**
   * Initialize FFmpeg with worker
   */
  async initialize(onProgress?: (progress: FFmpegProcessingProgress) => void): Promise<void> {
    if (this.isLoaded) return;
    if (this.isLoading) {
      throw new Error('FFmpeg is already being loaded');
    }

    this.isLoading = true;

    try {
      onProgress?.({
        stage: 'initializing',
        progress: 0,
        message: 'Loading FFmpeg WebAssembly core...'
      });

      // Load FFmpeg core files with fallback strategy and timeout
      const loadPromise = this.loadFFmpegCoreWithFallback(onProgress);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('FFmpeg loading timeout')), 30000)
      );

      const { coreURL, wasmURL, workerURL } = await Promise.race([loadPromise, timeoutPromise]);

      onProgress?.({
        stage: 'initializing',
        progress: 70,
        message: 'Initializing FFmpeg worker...'
      });

      // Initialize with timeout
      const initPromise = this.ffmpeg.load({
        coreURL,
        wasmURL,
        workerURL,
      });
      const initTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('FFmpeg initialization timeout')), 20000)
      );

      await Promise.race([initPromise, initTimeoutPromise]);

      onProgress?.({
        stage: 'initializing',
        progress: 100,
        message: 'FFmpeg ready for video processing!'
      });

      this.isLoaded = true;
      this.isLoading = false;
      console.log('[FFmpeg] Successfully initialized');

    } catch (error) {
      this.isLoading = false;
      console.error('Failed to initialize FFmpeg:', error);

      // Provide more specific error messages
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Connection timeout. Please check your internet connection and try again.';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'Cross-origin resource loading blocked. Please refresh the page and try again.';
        } else if (error.message.includes('CDN')) {
          errorMessage = 'Unable to load FFmpeg resources. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }

      throw new Error(`FFmpeg initialization failed: ${errorMessage}`);
    }
  }

  /**
   * Download video from URL as Uint8Array for FFmpeg with retry logic
   */
  private async downloadVideoData(url: string, maxRetries: number = 3): Promise<Uint8Array> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[FFmpeg] Downloading video (attempt ${attempt}/${maxRetries}): ${url}`);

        const response = await fetch(url, {
          mode: 'cors',
          headers: {
            'Accept': 'video/*,*/*;q=0.8'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) === 0) {
          throw new Error('Empty video file received');
        }

        return await fetchFile(response);

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`[FFmpeg] Download attempt ${attempt} failed:`, lastError.message);

        if (attempt < maxRetries) {
          // Exponential backoff: wait 1s, 2s, 4s between retries
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`[FFmpeg] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Failed to download video after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Validate video segments before processing
   */
  private validateVideoSegments(segments: VideoSegment[]): void {
    if (!segments || segments.length === 0) {
      throw new Error('No video segments provided for concatenation');
    }

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (!segment.videoUrl) {
        throw new Error(`Segment ${i + 1} is missing video URL`);
      }
      if (!segment.videoUrl.startsWith('http')) {
        throw new Error(`Segment ${i + 1} has invalid video URL: ${segment.videoUrl}`);
      }
      if (!segment.duration || segment.duration <= 0) {
        throw new Error(`Segment ${i + 1} has invalid duration: ${segment.duration}`);
      }
    }
  }

  /**
   * Concatenate video segments using FFmpeg
   */
  async concatenateVideoSegments(
    segments: VideoSegment[],
    options: {
      quality?: 'high' | 'medium' | 'low';
      format?: 'mp4' | 'webm';
      onProgress?: (progress: FFmpegProcessingProgress) => void;
    } = {}
  ): Promise<CombinedVideoResult> {
    const { quality = 'medium', format = 'mp4', onProgress } = options;
    const startTime = Date.now();

    try {
      // Validate input segments first
      this.validateVideoSegments(segments);

      // Ensure FFmpeg is initialized
      if (!this.isLoaded) {
        await this.initialize(onProgress);
      }

      onProgress?.({
        stage: 'loading_segments',
        progress: 0,
        message: 'Downloading video segments...'
      });

      // Download all video segments
      const inputFiles: string[] = [];
      const totalSegments = segments.length;

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];

        onProgress?.({
          stage: 'loading_segments',
          progress: (i / totalSegments) * 50,
          message: `Downloading segment ${i + 1}/${totalSegments}... (${segment.videoUrl.substring(0, 50)}...)`
        });

        try {
          const videoData = await this.downloadVideoData(segment.videoUrl);
          const inputFileName = `input${i}.mp4`;

          console.log(`[FFmpeg] Writing segment ${i + 1} to FFmpeg filesystem (${videoData.length} bytes)`);
          await this.ffmpeg.writeFile(inputFileName, videoData);
          inputFiles.push(inputFileName);

          onProgress?.({
            stage: 'loading_segments',
            progress: ((i + 1) / totalSegments) * 50,
            message: `Downloaded segment ${i + 1}/${totalSegments} (${Math.round(videoData.length / 1024)}KB)`
          });

        } catch (error) {
          throw new Error(`Failed to download segment ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      onProgress?.({
        stage: 'concatenating',
        progress: 50,
        message: 'Preparing video concatenation...'
      });

      // Create concat file list for FFmpeg
      const concatList = inputFiles.map(file => `file '${file}'`).join('\n');
      await this.ffmpeg.writeFile('concat_list.txt', concatList);

      // Set up FFmpeg command based on quality and format
      const outputFileName = `combined_video.${format}`;
      let ffmpegArgs: string[];

      if (format === 'mp4') {
        // MP4 output with H.264
        ffmpegArgs = [
          '-f', 'concat',
          '-safe', '0',
          '-i', 'concat_list.txt',
          '-c:v', 'libx264',
          '-c:a', 'aac',
          ...this.getQualitySettings(quality),
          '-movflags', '+faststart', // Optimize for web streaming
          outputFileName
        ];
      } else {
        // WebM output with VP9
        ffmpegArgs = [
          '-f', 'concat',
          '-safe', '0',
          '-i', 'concat_list.txt',
          '-c:v', 'libvpx-vp9',
          '-c:a', 'libopus',
          ...this.getQualitySettings(quality, 'webm'),
          outputFileName
        ];
      }

      onProgress?.({
        stage: 'concatenating',
        progress: 60,
        message: `Concatenating ${segments.length} video segments...`
      });

      // Execute FFmpeg concatenation
      await this.ffmpeg.exec(ffmpegArgs);

      onProgress?.({
        stage: 'finalizing',
        progress: 90,
        message: 'Finalizing combined video...'
      });

      // Read the output file
      const outputData = await this.ffmpeg.readFile(outputFileName);
      const videoBlob = new Blob([outputData], {
        type: format === 'mp4' ? 'video/mp4' : 'video/webm'
      });

      // Clean up temporary files
      for (const inputFile of inputFiles) {
        try {
          await this.ffmpeg.deleteFile(inputFile);
        } catch (error) {
          console.warn(`Failed to clean up ${inputFile}:`, error);
        }
      }

      try {
        await this.ffmpeg.deleteFile('concat_list.txt');
        await this.ffmpeg.deleteFile(outputFileName);
      } catch (error) {
        console.warn('Failed to clean up temporary files:', error);
      }

      const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);
      const elapsedTime = Date.now() - startTime;

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: `Video concatenation complete! (${Math.round(elapsedTime / 1000)}s)`,
        timeElapsed: elapsedTime
      });

      return {
        videoBlob,
        duration: totalDuration,
        segments,
        format,
        size: videoBlob.size,
        quality
      };

    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      console.error('FFmpeg concatenation failed:', error);

      // Cleanup any created files
      try {
        const files = await this.ffmpeg.listDir('.');
        for (const file of files) {
          if (file.name.startsWith('input') || file.name === 'concat_list.txt' || file.name.includes('combined_video')) {
            try {
              await this.ffmpeg.deleteFile(file.name);
            } catch (cleanupError) {
              console.warn(`Failed to cleanup file ${file.name}:`, cleanupError);
            }
          }
        }
      } catch (listError) {
        console.warn('Failed to cleanup files after error:', listError);
      }

      // Provide user-friendly error message
      let userMessage = 'Video concatenation failed';
      if (error instanceof Error) {
        if (error.message.includes('Failed to download')) {
          userMessage = 'Unable to download video segments. Please check your internet connection and try again.';
        } else if (error.message.includes('FFmpeg initialization')) {
          userMessage = 'Video processing engine failed to load. Please refresh the page and try again.';
        } else if (error.message.includes('Invalid video URL')) {
          userMessage = 'Some video segments are invalid. Please regenerate the video content.';
        } else {
          userMessage = `Video processing error: ${error.message}`;
        }
      }

      onProgress?.({
        stage: 'error',
        progress: 0,
        message: userMessage,
        timeElapsed: elapsedTime
      });

      throw new Error(userMessage);
    }
  }

  /**
   * Get quality settings for encoding
   */
  private getQualitySettings(quality: 'high' | 'medium' | 'low', format: 'mp4' | 'webm' = 'mp4'): string[] {
    if (format === 'mp4') {
      switch (quality) {
        case 'high':
          return ['-preset', 'medium', '-crf', '20', '-profile:v', 'high', '-level', '4.0'];
        case 'medium':
          return ['-preset', 'fast', '-crf', '23', '-profile:v', 'main'];
        case 'low':
          return ['-preset', 'fast', '-crf', '28', '-profile:v', 'baseline'];
        default:
          return ['-preset', 'fast', '-crf', '23'];
      }
    } else {
      // WebM/VP9 settings
      switch (quality) {
        case 'high':
          return ['-deadline', 'good', '-cpu-used', '2', '-crf', '20', '-b:v', '2M'];
        case 'medium':
          return ['-deadline', 'good', '-cpu-used', '3', '-crf', '25', '-b:v', '1M'];
        case 'low':
          return ['-deadline', 'realtime', '-cpu-used', '4', '-crf', '30', '-b:v', '500k'];
        default:
          return ['-deadline', 'good', '-cpu-used', '3', '-crf', '25'];
      }
    }
  }

  /**
   * Convert video format (e.g., WebM to MP4)
   */
  async convertVideo(
    inputBlob: Blob,
    targetFormat: 'mp4' | 'webm',
    quality: 'high' | 'medium' | 'low' = 'medium',
    onProgress?: (progress: FFmpegProcessingProgress) => void
  ): Promise<Blob> {
    if (!this.isLoaded) {
      await this.initialize(onProgress);
    }

    try {
      onProgress?.({
        stage: 'loading_segments',
        progress: 0,
        message: 'Preparing video for conversion...'
      });

      // Write input file
      const inputData = new Uint8Array(await inputBlob.arrayBuffer());
      const inputFileName = 'input_video.webm';
      const outputFileName = `converted_video.${targetFormat}`;

      await this.ffmpeg.writeFile(inputFileName, inputData);

      onProgress?.({
        stage: 'concatenating',
        progress: 30,
        message: `Converting to ${targetFormat.toUpperCase()}...`
      });

      // Convert video
      const ffmpegArgs = [
        '-i', inputFileName,
        '-c:v', targetFormat === 'mp4' ? 'libx264' : 'libvpx-vp9',
        '-c:a', targetFormat === 'mp4' ? 'aac' : 'libopus',
        ...this.getQualitySettings(quality, targetFormat),
        outputFileName
      ];

      await this.ffmpeg.exec(ffmpegArgs);

      onProgress?.({
        stage: 'finalizing',
        progress: 90,
        message: 'Finalizing converted video...'
      });

      const outputData = await this.ffmpeg.readFile(outputFileName);
      const convertedBlob = new Blob([outputData], {
        type: targetFormat === 'mp4' ? 'video/mp4' : 'video/webm'
      });

      // Clean up
      await this.ffmpeg.deleteFile(inputFileName);
      await this.ffmpeg.deleteFile(outputFileName);

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Video conversion complete!'
      });

      return convertedBlob;

    } catch (error) {
      console.error('Video conversion failed:', error);
      throw new Error(`Video conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate video thumbnail
   */
  async generateThumbnail(
    videoBlob: Blob,
    timeSeconds: number = 1,
    width: number = 320,
    height: number = 180
  ): Promise<Blob> {
    if (!this.isLoaded) {
      await this.initialize();
    }

    try {
      const inputData = new Uint8Array(await videoBlob.arrayBuffer());
      const inputFileName = 'thumbnail_input.mp4';
      const outputFileName = 'thumbnail.jpg';

      await this.ffmpeg.writeFile(inputFileName, inputData);

      await this.ffmpeg.exec([
        '-i', inputFileName,
        '-ss', timeSeconds.toString(),
        '-vframes', '1',
        '-vf', `scale=${width}:${height}`,
        '-q:v', '2',
        outputFileName
      ]);

      const thumbnailData = await this.ffmpeg.readFile(outputFileName);
      const thumbnailBlob = new Blob([thumbnailData], { type: 'image/jpeg' });

      // Clean up
      await this.ffmpeg.deleteFile(inputFileName);
      await this.ffmpeg.deleteFile(outputFileName);

      return thumbnailBlob;

    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      throw new Error(`Thumbnail generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if FFmpeg is ready
   */
  isReady(): boolean {
    return this.isLoaded;
  }

  /**
   * Terminate FFmpeg worker (cleanup)
   */
  async terminate(): Promise<void> {
    if (this.isLoaded) {
      await this.ffmpeg.terminate();
      this.isLoaded = false;
    }
  }
}

// Singleton instance
let ffmpegProcessor: FFmpegVideoProcessor | null = null;

/**
 * Get or create FFmpeg processor singleton
 */
export function getFFmpegProcessor(): FFmpegVideoProcessor {
  if (!ffmpegProcessor) {
    ffmpegProcessor = new FFmpegVideoProcessor();
  }
  return ffmpegProcessor;
}

/**
 * Simple wrapper function for video concatenation
 */
export async function concatenateWithFFmpeg(
  segments: VideoSegment[],
  options: {
    quality?: 'high' | 'medium' | 'low';
    format?: 'mp4' | 'webm';
    onProgress?: (progress: FFmpegProcessingProgress) => void;
  } = {}
): Promise<CombinedVideoResult> {
  const processor = getFFmpegProcessor();
  return processor.concatenateVideoSegments(segments, options);
}

/**
 * Create video with different quality/format options
 */
export interface VideoExportOptions {
  format: 'mp4' | 'webm';
  quality: 'high' | 'medium' | 'low';
  generateThumbnail?: boolean;
}

export async function createVideoExport(
  segments: VideoSegment[],
  options: VideoExportOptions,
  onProgress?: (progress: FFmpegProcessingProgress) => void
): Promise<{
  video: CombinedVideoResult;
  thumbnail?: Blob;
}> {
  const processor = getFFmpegProcessor();

  const video = await processor.concatenateVideoSegments(segments, {
    quality: options.quality,
    format: options.format,
    onProgress
  });

  let thumbnail: Blob | undefined;
  if (options.generateThumbnail) {
    try {
      thumbnail = await processor.generateThumbnail(video.videoBlob, 1);
    } catch (error) {
      console.warn('Thumbnail generation failed:', error);
    }
  }

  return { video, thumbnail };
}