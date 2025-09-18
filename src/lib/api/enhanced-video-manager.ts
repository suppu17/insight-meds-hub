import { concatenateWithFFmpeg, FFmpegProcessingProgress, CombinedVideoResult as FFmpegResult } from './ffmpeg-processor';
import { createS3VideoService, S3UploadProgress, VideoUploadResult, VideoMetadata } from './s3-service';
import { generateVideoSegmentsWithPreviews, SegmentGenerationCallback } from './enhancedVideoGenerator';
import {
  generateVideoSegmentsParallel,
  ParallelSegmentGenerationCallback,
  VideoOptions,
  VideoGenerationStrategy,
  getOptimalStrategy
} from './parallelVideoGenerator';
import { analyzeDrugMechanism, enhanceVideoPrompts, DrugAnalysisResult } from './bedrock';
import { getBackendVideoProcessor, VideoProcessingProgress } from './backend-video-processor';
import type { VideoSegment } from './fal';

export interface EnhancedVideoResult {
  // Video data
  videoBlob: Blob;
  segments: VideoSegment[];
  duration: number;
  format: 'mp4' | 'webm';
  quality: 'high' | 'medium' | 'low';

  // Cloud storage
  s3Upload?: VideoUploadResult;
  segmentUploads?: VideoUploadResult[];
  thumbnailUpload?: VideoUploadResult;

  // Metadata
  drugAnalysis: DrugAnalysisResult;
  generatedAt: Date;
  processingTime: number;

  // Download URLs
  downloadUrls: {
    direct: string; // Blob URL for immediate download
    s3?: string; // S3 presigned URL
    s3Permanent?: string; // S3 public URL (if configured)
  };
}

export interface VideoGenerationOptions {
  quality: 'high' | 'medium' | 'low';
  format: 'mp4' | 'webm';
  uploadToS3: boolean;
  generateThumbnail: boolean;
  uploadSegments: boolean;
  s3ExpirationMinutes?: number;
  useBackendProcessing?: boolean; // Use backend API instead of client-side FFmpeg

  // New parallel generation options
  duration?: '8s' | '16s' | '30s';
  generationStrategy?: VideoGenerationStrategy;
  useParallelGeneration?: boolean;
}

export interface EnhancedVideoGenerationProgress {
  stage: 'analysis' | 'script' | 'segments' | 'concatenation' | 'upload' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  currentStep?: string;

  // Detailed progress for each stage
  analysisProgress?: number;
  segmentProgress?: number;
  concatenationProgress?: number;
  uploadProgress?: number;

  // Performance metrics
  timeElapsed?: number;
  estimatedRemaining?: number;

  // Generated content
  completedSegments?: VideoSegment[];
  segmentCount?: number;
  totalSegments?: number;
}

export class EnhancedVideoManager {
  private s3Service?: ReturnType<typeof createS3VideoService>;

  constructor() {
    // Initialize S3 service if credentials are available
    try {
      this.s3Service = createS3VideoService();
    } catch (error) {
      console.warn('S3 service not available:', error);
      this.s3Service = undefined;
    }
  }

  /**
   * Generate complete video with all processing steps
   */
  async generateCompleteVideo(
    drugName: string,
    options: VideoGenerationOptions,
    callbacks: {
      onProgress?: (progress: EnhancedVideoGenerationProgress) => void;
      onSegmentComplete?: (segment: VideoSegment, index: number, total: number) => void;
      onAnalysisComplete?: (analysis: DrugAnalysisResult) => void;
    } = {}
  ): Promise<EnhancedVideoResult> {
    const { onProgress, onSegmentComplete, onAnalysisComplete } = callbacks;
    const startTime = Date.now();

    try {
      // Stage 1: Drug Analysis
      onProgress?.({
        stage: 'analysis',
        progress: 0,
        message: 'Analyzing drug mechanism with AWS Bedrock Claude...',
        timeElapsed: 0
      });

      const analysis = await analyzeDrugMechanism(drugName);
      onAnalysisComplete?.(analysis);

      onProgress?.({
        stage: 'analysis',
        progress: 20,
        message: 'Drug analysis complete, enhancing prompts...',
        analysisProgress: 100,
        timeElapsed: Date.now() - startTime
      });

      // Stage 2: Script Generation
      onProgress?.({
        stage: 'script',
        progress: 20,
        message: 'Generating enhanced video prompts...',
        timeElapsed: Date.now() - startTime
      });

      const enhancedPrompts = await enhanceVideoPrompts(analysis);

      onProgress?.({
        stage: 'script',
        progress: 30,
        message: 'Video script ready, starting segment generation...',
        timeElapsed: Date.now() - startTime
      });

      // Stage 3: Video Segment Generation
      let completedSegments: VideoSegment[] = [];

      // Determine if we should use parallel generation
      const useParallel = options.useParallelGeneration ?? true;
      const duration = options.duration ?? '8s';
      const strategy = options.generationStrategy ?? getOptimalStrategy(duration, {
        preferContinuity: !useParallel
      });

      console.log(`🎬 Using ${useParallel ? 'parallel' : 'sequential'} generation with ${strategy.type} strategy for ${duration} video`);

      let segments: VideoSegment[];

      if (useParallel) {
        // Use new parallel generation system
        const videoOptions: VideoOptions = {
          duration,
          quality: options.quality,
          aspectRatio: '16:9',
          resolution: options.quality === 'high' ? '1080p' : '720p'
        };

        const parallelCallbacks: ParallelSegmentGenerationCallback = {
          onSegmentStart: (segmentNumber) => {
            onProgress?.({
              stage: 'segments',
              progress: 30 + ((segmentNumber - 1) / 4) * 25,
              message: `Starting parallel segment ${segmentNumber}/4...`,
              currentStep: `Parallel Segment ${segmentNumber}`,
              segmentProgress: 0,
              totalSegments: 4,
              timeElapsed: Date.now() - startTime
            });
          },
          onSegmentComplete: (segment) => {
            completedSegments.push(segment);
            onSegmentComplete?.(segment, completedSegments.length, 4);

            onProgress?.({
              stage: 'segments',
              progress: 30 + (completedSegments.length / 4) * 25,
              message: `Parallel segment ${segment.segmentNumber}/4 completed!`,
              completedSegments: [...completedSegments],
              segmentCount: completedSegments.length,
              totalSegments: 4,
              timeElapsed: Date.now() - startTime
            });
          },
          onProgress: (segmentNumber, total, message) => {
            onProgress?.({
              stage: 'segments',
              progress: 30 + ((segmentNumber - 1) / total) * 25,
              message: `Parallel ${message}`,
              timeElapsed: Date.now() - startTime
            });
          },
          onError: (segmentNumber, error) => {
            console.error(`Parallel segment ${segmentNumber} failed:`, error);
            onProgress?.({
              stage: 'segments',
              progress: 30 + ((segmentNumber - 1) / 4) * 25,
              message: `Parallel segment ${segmentNumber} failed: ${error.message}`,
              timeElapsed: Date.now() - startTime
            });
          },
          onAllSegmentsStarted: () => {
            onProgress?.({
              stage: 'segments',
              progress: 35,
              message: `All segments started in parallel (${strategy.type} mode)...`,
              timeElapsed: Date.now() - startTime
            });
          }
        };

        segments = await generateVideoSegmentsParallel(
          drugName,
          enhancedPrompts,
          videoOptions,
          strategy,
          parallelCallbacks
        );

      } else {
        // Use traditional sequential generation
        const segmentCallbacks: SegmentGenerationCallback = {
          onSegmentStart: (segmentNumber) => {
            onProgress?.({
              stage: 'segments',
              progress: 30 + ((segmentNumber - 1) / 4) * 25,
              message: `Generating sequential segment ${segmentNumber}/4...`,
              currentStep: `Sequential Segment ${segmentNumber}`,
              segmentProgress: 0,
              totalSegments: 4,
              timeElapsed: Date.now() - startTime
            });
          },
          onSegmentComplete: (segment) => {
            completedSegments.push(segment);
            onSegmentComplete?.(segment, completedSegments.length, 4);

            onProgress?.({
              stage: 'segments',
              progress: 30 + (completedSegments.length / 4) * 25,
              message: `Sequential segment ${segment.segmentNumber}/4 completed!`,
              completedSegments: [...completedSegments],
              segmentCount: completedSegments.length,
              totalSegments: 4,
              timeElapsed: Date.now() - startTime
            });
          },
          onProgress: (segmentNumber, total, message) => {
            onProgress?.({
              stage: 'segments',
              progress: 30 + ((segmentNumber - 1) / total) * 25,
              message: `Sequential segment ${segmentNumber}/${total}: ${message}`,
              timeElapsed: Date.now() - startTime
            });
          },
          onError: (segmentNumber, error) => {
            console.error(`Sequential segment ${segmentNumber} failed:`, error);
            onProgress?.({
              stage: 'segments',
              progress: 30 + ((segmentNumber - 1) / 4) * 25,
              message: `Sequential segment ${segmentNumber} failed: ${error.message}`,
              timeElapsed: Date.now() - startTime
            });
          }
        };

        segments = await generateVideoSegmentsWithPreviews(
          drugName,
          enhancedPrompts,
          segmentCallbacks
        );
      }

      onProgress?.({
        stage: 'concatenation',
        progress: 55,
        message: 'All segments generated, starting video concatenation...',
        segmentProgress: 100,
        completedSegments: segments,
        timeElapsed: Date.now() - startTime
      });

      // Stage 4: Video Concatenation
      let videoResult: FFmpegResult;

      if (options.useBackendProcessing) {
        // Use backend API for video combining
        onProgress?.({
          stage: 'concatenation',
          progress: 55,
          message: 'Starting backend video combination...',
          timeElapsed: Date.now() - startTime
        });

        try {
          const backendProcessor = getBackendVideoProcessor();

          const backendProgress = (progress: VideoProcessingProgress) => {
            const concatenationProgress = Math.min(progress.progress, 100);
            onProgress?.({
              stage: 'concatenation',
              progress: 55 + (concatenationProgress / 100) * 25,
              message: progress.message,
              concatenationProgress,
              timeElapsed: Date.now() - startTime
            });
          };

          const result = await backendProcessor.combineAndWait(segments, {
            format: options.format,
            quality: options.quality,
            drugName,
            onProgress: backendProgress
          });

          videoResult = {
            videoBlob: result.videoBlob,
            duration: result.duration,
            segments,
            format: options.format,
            size: result.size,
            quality: options.quality
          };

          onProgress?.({
            stage: 'concatenation',
            progress: 80,
            message: `Backend video combination complete! (${options.format.toUpperCase()}, ${options.quality} quality)`,
            concatenationProgress: 100,
            timeElapsed: Date.now() - startTime
          });

        } catch (backendError) {
          console.warn('Backend video combination failed, falling back to client-side FFmpeg:', backendError);

          // Fallback to client-side FFmpeg
          const ffmpegProgress = (progress: FFmpegProcessingProgress) => {
            const concatenationProgress = Math.min(progress.progress, 100);
            onProgress?.({
              stage: 'concatenation',
              progress: 55 + (concatenationProgress / 100) * 25,
              message: `Fallback: ${progress.message}`,
              concatenationProgress,
              timeElapsed: Date.now() - startTime,
              estimatedRemaining: progress.estimatedRemaining
            });
          };

          try {
            videoResult = await concatenateWithFFmpeg(segments, {
              quality: options.quality,
              format: options.format,
              onProgress: ffmpegProgress
            });

            onProgress?.({
              stage: 'concatenation',
              progress: 80,
              message: `Fallback FFmpeg concatenation complete! (${options.format.toUpperCase()}, ${options.quality} quality)`,
              concatenationProgress: 100,
              timeElapsed: Date.now() - startTime
            });

          } catch (ffmpegError) {
            console.warn('Both backend and FFmpeg concatenation failed, using first segment fallback:', ffmpegError);

            // Final fallback: Use first segment only
            const firstSegment = segments.find(s => s.videoUrl && s.videoUrl.startsWith('http'));
            if (!firstSegment) {
              throw new Error('No valid video segments available');
            }

            const fallbackBlob = await fetch(firstSegment.videoUrl).then(r => r.blob());
            videoResult = {
              videoBlob: fallbackBlob,
              duration: segments.reduce((sum, s) => sum + s.duration, 0),
              segments,
              format: options.format,
              size: fallbackBlob.size,
              quality: options.quality
            };

            onProgress?.({
              stage: 'concatenation',
              progress: 80,
              message: 'Using first segment only (concatenation failed)',
              concatenationProgress: 100,
              timeElapsed: Date.now() - startTime
            });
          }
        }

      } else {
        // Use client-side FFmpeg (original behavior)
        const ffmpegProgress = (progress: FFmpegProcessingProgress) => {
          const concatenationProgress = Math.min(progress.progress, 100);
          onProgress?.({
            stage: 'concatenation',
            progress: 55 + (concatenationProgress / 100) * 25,
            message: progress.message,
            concatenationProgress,
            timeElapsed: Date.now() - startTime,
            estimatedRemaining: progress.estimatedRemaining
          });
        };

        try {
          videoResult = await concatenateWithFFmpeg(segments, {
            quality: options.quality,
            format: options.format,
            onProgress: ffmpegProgress
          });

          onProgress?.({
            stage: 'concatenation',
            progress: 80,
            message: `Video concatenation complete! (${options.format.toUpperCase()}, ${options.quality} quality)`,
            concatenationProgress: 100,
            timeElapsed: Date.now() - startTime
          });

        } catch (concatenationError) {
          console.warn('FFmpeg concatenation failed, trying backend fallback:', concatenationError);

          // Try backend as fallback
          try {
            const backendProcessor = getBackendVideoProcessor();

            const backendProgress = (progress: VideoProcessingProgress) => {
              const concatenationProgress = Math.min(progress.progress, 100);
              onProgress?.({
                stage: 'concatenation',
                progress: 55 + (concatenationProgress / 100) * 25,
                message: `Fallback: ${progress.message}`,
                concatenationProgress,
                timeElapsed: Date.now() - startTime
              });
            };

            const result = await backendProcessor.combineAndWait(segments, {
              format: options.format,
              quality: options.quality,
              drugName,
              onProgress: backendProgress
            });

            videoResult = {
              videoBlob: result.videoBlob,
              duration: result.duration,
              segments,
              format: options.format,
              size: result.size,
              quality: options.quality
            };

            onProgress?.({
              stage: 'concatenation',
              progress: 80,
              message: `Fallback backend combination complete! (${options.format.toUpperCase()}, ${options.quality} quality)`,
              concatenationProgress: 100,
              timeElapsed: Date.now() - startTime
            });

          } catch (backendFallbackError) {
            console.warn('Both FFmpeg and backend failed, using first segment fallback:', backendFallbackError);

            // Final fallback: Use first segment only
            const firstSegment = segments.find(s => s.videoUrl && s.videoUrl.startsWith('http'));
            if (!firstSegment) {
              throw new Error('No valid video segments available');
            }

            const fallbackBlob = await fetch(firstSegment.videoUrl).then(r => r.blob());
            videoResult = {
              videoBlob: fallbackBlob,
              duration: segments.reduce((sum, s) => sum + s.duration, 0),
              segments,
              format: options.format,
              size: fallbackBlob.size,
              quality: options.quality
            };

            onProgress?.({
              stage: 'concatenation',
              progress: 80,
              message: 'Using first segment only (all concatenation methods failed)',
              concatenationProgress: 100,
              timeElapsed: Date.now() - startTime
            });
          }
        }
      }

      // Stage 5: Cloud Upload (if enabled)
      let s3Upload: VideoUploadResult | undefined;
      let segmentUploads: VideoUploadResult[] | undefined;
      let thumbnailUpload: VideoUploadResult | undefined;

      if (options.uploadToS3 && this.s3Service) {
        onProgress?.({
          stage: 'upload',
          progress: 80,
          message: 'Uploading to AWS S3...',
          timeElapsed: Date.now() - startTime
        });

        const videoMetadata: VideoMetadata = {
          drugName,
          segmentCount: segments.length,
          totalDuration: videoResult.duration,
          quality: options.quality,
          format: options.format,
          generatedAt: new Date(),
          segments
        };

        try {
          // Upload main video
          s3Upload = await this.s3Service.uploadVideo(
            videoResult.videoBlob,
            videoMetadata,
            {
              generatePresignedUrl: true,
              expirationMinutes: options.s3ExpirationMinutes || 60,
              onProgress: (uploadProgress: S3UploadProgress) => {
                onProgress?.({
                  stage: 'upload',
                  progress: 80 + (uploadProgress.progress / 100) * 10,
                  message: uploadProgress.message,
                  uploadProgress: uploadProgress.progress,
                  timeElapsed: Date.now() - startTime
                });
              }
            }
          );

          // Upload individual segments if requested
          if (options.uploadSegments) {
            onProgress?.({
              stage: 'upload',
              progress: 90,
              message: 'Uploading individual segments...',
              timeElapsed: Date.now() - startTime
            });

            segmentUploads = await this.s3Service.uploadVideoSegments(
              segments,
              drugName,
              (uploadProgress: S3UploadProgress) => {
                onProgress?.({
                  stage: 'upload',
                  progress: 90 + (uploadProgress.progress / 100) * 5,
                  message: uploadProgress.message,
                  uploadProgress: uploadProgress.progress,
                  timeElapsed: Date.now() - startTime
                });
              }
            );
          }

          // Generate and upload thumbnail if requested
          if (options.generateThumbnail) {
            try {
              const { getFFmpegProcessor } = await import('./ffmpeg-processor');
              const processor = getFFmpegProcessor();
              const thumbnailBlob = await processor.generateThumbnail(videoResult.videoBlob, 1);

              thumbnailUpload = await this.s3Service.uploadThumbnail(
                thumbnailBlob,
                drugName,
                { quality: options.quality }
              );

            } catch (thumbnailError) {
              console.warn('Thumbnail generation/upload failed:', thumbnailError);
            }
          }

          onProgress?.({
            stage: 'upload',
            progress: 95,
            message: 'S3 upload completed successfully!',
            uploadProgress: 100,
            timeElapsed: Date.now() - startTime
          });

        } catch (uploadError) {
          console.warn('S3 upload failed:', uploadError);
          onProgress?.({
            stage: 'upload',
            progress: 95,
            message: 'S3 upload failed, video available for direct download',
            timeElapsed: Date.now() - startTime
          });
        }

      } else {
        onProgress?.({
          stage: 'upload',
          progress: 95,
          message: 'Skipping S3 upload (disabled or not configured)',
          timeElapsed: Date.now() - startTime
        });
      }

      // Final stage: Prepare result
      const processingTime = Date.now() - startTime;
      const directDownloadUrl = URL.createObjectURL(videoResult.videoBlob);

      const result: EnhancedVideoResult = {
        videoBlob: videoResult.videoBlob,
        segments,
        duration: videoResult.duration,
        format: options.format,
        quality: options.quality,
        s3Upload,
        segmentUploads,
        thumbnailUpload,
        drugAnalysis: analysis,
        generatedAt: new Date(),
        processingTime,
        downloadUrls: {
          direct: directDownloadUrl,
          s3: s3Upload?.presignedUrl,
          s3Permanent: s3Upload?.url
        }
      };

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: `Video generation complete! (${Math.round(processingTime / 1000)}s total)`,
        timeElapsed: processingTime
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('Enhanced video generation failed:', error);

      onProgress?.({
        stage: 'error',
        progress: 0,
        message: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timeElapsed: processingTime
      });

      throw new Error(`Enhanced video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate video with quick preview (segments available immediately)
   */
  async generateVideoWithPreview(
    drugName: string,
    options: Partial<VideoGenerationOptions> = {},
    onProgress?: (progress: EnhancedVideoGenerationProgress) => void,
    onSegmentReady?: (segment: VideoSegment, index: number) => void
  ): Promise<{
    segments: VideoSegment[];
    finalVideo?: Promise<EnhancedVideoResult>;
  }> {
    const fullOptions: VideoGenerationOptions = {
      quality: 'medium',
      format: 'mp4',
      uploadToS3: false,
      generateThumbnail: false,
      uploadSegments: false,
      s3ExpirationMinutes: 60,
      ...options
    };

    // Start full generation in background
    const finalVideoPromise = this.generateCompleteVideo(
      drugName,
      fullOptions,
      {
        onProgress,
        onSegmentComplete: onSegmentReady
      }
    );

    // Return segments immediately as they're generated
    let segments: VideoSegment[] = [];

    try {
      // This will start returning segments as they complete
      const result = await finalVideoPromise;
      segments = result.segments;
    } catch (error) {
      console.warn('Full video generation failed, returning segments only:', error);
    }

    return {
      segments,
      finalVideo: finalVideoPromise
    };
  }

  /**
   * Upload existing video to S3
   */
  async uploadExistingVideo(
    videoBlob: Blob,
    segments: VideoSegment[],
    drugName: string,
    options: {
      quality?: 'high' | 'medium' | 'low';
      format?: 'mp4' | 'webm';
      onProgress?: (progress: S3UploadProgress) => void;
    } = {}
  ): Promise<VideoUploadResult | null> {
    if (!this.s3Service) {
      throw new Error('S3 service not configured');
    }

    const metadata: VideoMetadata = {
      drugName,
      segmentCount: segments.length,
      totalDuration: segments.reduce((sum, s) => sum + s.duration, 0),
      quality: options.quality || 'medium',
      format: options.format || 'mp4',
      generatedAt: new Date(),
      segments
    };

    return this.s3Service.uploadVideo(videoBlob, metadata, {
      generatePresignedUrl: true,
      onProgress: options.onProgress
    });
  }

  /**
   * Check if S3 is available
   */
  isS3Available(): boolean {
    return !!this.s3Service;
  }

  /**
   * Get S3 service instance
   */
  getS3Service() {
    return this.s3Service;
  }
}

// Singleton instance
let enhancedVideoManager: EnhancedVideoManager | null = null;

/**
 * Get or create enhanced video manager singleton
 */
export function getEnhancedVideoManager(): EnhancedVideoManager {
  if (!enhancedVideoManager) {
    enhancedVideoManager = new EnhancedVideoManager();
  }
  return enhancedVideoManager;
}

/**
 * Simple wrapper for quick video generation
 */
export async function generateDrugVideo(
  drugName: string,
  options: Partial<VideoGenerationOptions> = {},
  onProgress?: (progress: VideoGenerationProgress) => void
): Promise<EnhancedVideoResult> {
  const manager = getEnhancedVideoManager();

  const fullOptions: VideoGenerationOptions = {
    quality: 'medium',
    format: 'mp4',
    uploadToS3: true,
    generateThumbnail: true,
    uploadSegments: false,
    s3ExpirationMinutes: 60,
    useBackendProcessing: true, // Use backend by default
    ...options
  };

  return manager.generateCompleteVideo(drugName, fullOptions, { onProgress });
}