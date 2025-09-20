import { generateVideoFromText, generateVideoFromImage, extractLastFrameFromVideo, VideoSegment } from './fal';

export interface VideoOptions {
  duration: '8s' | '16s' | '30s';
  quality: 'high' | 'medium' | 'low';
  aspectRatio: '16:9' | '9:16' | '1:1';
  resolution: '1080p' | '720p';
}

export interface ParallelSegmentGenerationCallback {
  onSegmentStart: (segmentNumber: number) => void;
  onSegmentComplete: (segment: VideoSegment) => void;
  onProgress: (segmentNumber: number, total: number, message: string) => void;
  onError: (segmentNumber: number, error: Error) => void;
  onAllSegmentsStarted?: () => void;
}

export interface VideoGenerationStrategy {
  type: 'sequential' | 'parallel' | 'hybrid';
  maxConcurrency?: number; // For parallel/hybrid modes
}

/**
 * Calculate segment durations based on total video duration
 */
function calculateSegmentDurations(totalDuration: '8s' | '16s' | '30s'): number[] {
  switch (totalDuration) {
    case '8s':
      return [2, 2, 2, 2]; // 4 segments of 2 seconds each
    case '16s':
      return [4, 4, 4, 4]; // 4 segments of 4 seconds each
    case '30s':
      return [8, 8, 8, 6]; // Traditional 30-second format
    default:
      return [8, 8, 8, 6];
  }
}

/**
 * Enhanced parallel video generation with configurable duration and strategy
 */
export async function generateVideoSegmentsParallel(
  drugName: string,
  segmentPrompts: string[],
  options: VideoOptions,
  strategy: VideoGenerationStrategy,
  callbacks: ParallelSegmentGenerationCallback
): Promise<VideoSegment[]> {
  if (segmentPrompts.length !== 4) {
    throw new Error("Exactly 4 segment prompts are required");
  }

  const segmentDurations = calculateSegmentDurations(options.duration);
  const completedSegments: VideoSegment[] = [];

  try {
    switch (strategy.type) {
      case 'parallel':
        return await generateAllSegmentsParallel(
          drugName,
          segmentPrompts,
          segmentDurations,
          options,
          callbacks
        );

      case 'hybrid':
        return await generateSegmentsHybrid(
          drugName,
          segmentPrompts,
          segmentDurations,
          options,
          strategy.maxConcurrency || 2,
          callbacks
        );

      case 'sequential':
      default:
        return await generateSegmentsSequential(
          drugName,
          segmentPrompts,
          segmentDurations,
          options,
          callbacks
        );
    }
  } catch (error) {
    throw new Error(`Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate all segments in parallel (fastest but uses most resources)
 */
async function generateAllSegmentsParallel(
  drugName: string,
  segmentPrompts: string[],
  durations: number[],
  options: VideoOptions,
  callbacks: ParallelSegmentGenerationCallback
): Promise<VideoSegment[]> {

  console.log('🚀 Starting parallel video generation for all segments...');

  // Start all segments simultaneously
  const segmentPromises = segmentPrompts.map(async (prompt, index) => {
    const segmentNumber = index + 1;
    const duration = durations[index];

    // Notify segment generation started
    callbacks.onSegmentStart(segmentNumber);
    callbacks.onProgress(segmentNumber, 4, `Starting parallel segment ${segmentNumber}/4...`);

    try {
      let videoResult;

      // For parallel generation, all segments use text-to-video
      // This avoids the dependency chain of image-to-video
      callbacks.onProgress(segmentNumber, 4, `Generating segment ${segmentNumber} (${duration}s)...`);

      videoResult = await generateVideoFromText(prompt, {
        duration: `${duration}s` as any,
        aspectRatio: options.aspectRatio,
        resolution: options.resolution === '1080p' ? '1080p' : '720p',
        generateAudio: true
      });

      // Create segment info
      const segment: VideoSegment = {
        segmentNumber,
        prompt,
        videoUrl: videoResult.video.url,
        duration
      };

      // Notify segment completion immediately
      callbacks.onSegmentComplete(segment);
      callbacks.onProgress(segmentNumber, 4, `Segment ${segmentNumber} completed in parallel!`);

      return segment;

    } catch (error) {
      const segmentError = new Error(`Failed to generate segment ${segmentNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error(`❌ Parallel segment ${segmentNumber} generation failed:`, segmentError);
      callbacks.onError(segmentNumber, segmentError);

      // Create a fallback placeholder segment
      const fallbackSegment: VideoSegment = {
        segmentNumber,
        prompt,
        videoUrl: "", // Empty URL indicates failed segment
        duration
      };

      callbacks.onSegmentComplete(fallbackSegment);
      return fallbackSegment;
    }
  });

  callbacks.onAllSegmentsStarted?.();

  // Wait for all segments to complete
  const segments = await Promise.all(segmentPromises);

  // Filter out failed segments and log results
  const validSegments = segments.filter(s => s.videoUrl && s.videoUrl.startsWith('http'));
  const failedCount = segments.length - validSegments.length;
  
  if (failedCount > 0) {
    console.warn(`⚠️ ${failedCount}/${segments.length} parallel segments failed`);
  }
  
  console.log(`✅ Parallel video generation completed: ${validSegments.length}/${segments.length} segments successful`);
  return segments.sort((a, b) => a.segmentNumber - b.segmentNumber);
}

/**
 * Generate segments in batches (hybrid approach for balanced performance)
 */
async function generateSegmentsHybrid(
  drugName: string,
  segmentPrompts: string[],
  durations: number[],
  options: VideoOptions,
  maxConcurrency: number,
  callbacks: ParallelSegmentGenerationCallback
): Promise<VideoSegment[]> {

  console.log(`🔄 Starting hybrid video generation (max ${maxConcurrency} concurrent)...`);

  const completedSegments: VideoSegment[] = [];

  // Process segments in batches
  for (let i = 0; i < segmentPrompts.length; i += maxConcurrency) {
    const batch = segmentPrompts.slice(i, i + maxConcurrency);
    const batchPromises = batch.map(async (prompt, batchIndex) => {
      const segmentIndex = i + batchIndex;
      const segmentNumber = segmentIndex + 1;
      const duration = durations[segmentIndex];

      callbacks.onSegmentStart(segmentNumber);
      callbacks.onProgress(segmentNumber, 4, `Starting batch segment ${segmentNumber}/4...`);

      try {
        let videoResult;

        if (segmentIndex === 0) {
          // First segment always uses text-to-video
          videoResult = await generateVideoFromText(prompt, {
            duration: `${duration}s` as any,
            aspectRatio: options.aspectRatio,
            resolution: options.resolution === '1080p' ? '1080p' : '720p',
            generateAudio: true
          });
        } else {
          // For hybrid mode, use text-to-video for parallel segments
          // This avoids complex frame extraction dependencies
          videoResult = await generateVideoFromText(prompt, {
            duration: `${duration}s` as any,
            aspectRatio: options.aspectRatio,
            resolution: options.resolution === '1080p' ? '1080p' : '720p',
            generateAudio: true
          });
        }

        const segment: VideoSegment = {
          segmentNumber,
          prompt,
          videoUrl: videoResult.video.url,
          duration
        };

        callbacks.onSegmentComplete(segment);
        callbacks.onProgress(segmentNumber, 4, `Batch segment ${segmentNumber} completed!`);

        return segment;

      } catch (error) {
        const segmentError = new Error(`Failed to generate segment ${segmentNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        callbacks.onError(segmentNumber, segmentError);

        const fallbackSegment: VideoSegment = {
          segmentNumber,
          prompt,
          videoUrl: "",
          duration
        };

        callbacks.onSegmentComplete(fallbackSegment);
        return fallbackSegment;
      }
    });

    // Wait for current batch to complete before starting next batch
    const batchResults = await Promise.all(batchPromises);
    completedSegments.push(...batchResults);

    console.log(`✅ Batch ${Math.floor(i / maxConcurrency) + 1} completed`);
  }

  return completedSegments.sort((a, b) => a.segmentNumber - b.segmentNumber);
}

/**
 * Generate segments sequentially (traditional approach, preserves frame continuity)
 */
async function generateSegmentsSequential(
  drugName: string,
  segmentPrompts: string[],
  durations: number[],
  options: VideoOptions,
  callbacks: ParallelSegmentGenerationCallback
): Promise<VideoSegment[]> {

  console.log('⏭️ Starting sequential video generation...');

  const completedSegments: VideoSegment[] = [];
  let lastFrameBlob: Blob | null = null;

  for (let i = 0; i < segmentPrompts.length; i++) {
    const segmentNumber = i + 1;
    const prompt = segmentPrompts[i];
    const duration = durations[i];

    callbacks.onSegmentStart(segmentNumber);
    callbacks.onProgress(segmentNumber, 4, `Starting sequential segment ${segmentNumber}/4...`);

    try {
      let videoResult;

      if (i === 0) {
        // First segment: text-to-video
        callbacks.onProgress(segmentNumber, 4, `Generating introduction video (${duration}s)...`);
        videoResult = await generateVideoFromText(prompt, {
          duration: `${duration}s` as any,
          aspectRatio: options.aspectRatio,
          resolution: options.resolution === '1080p' ? '1080p' : '720p',
          generateAudio: true
        });
      } else {
        // Subsequent segments: image-to-video using last frame
        if (!lastFrameBlob) {
          // Fallback to text-to-video if no frame available
          videoResult = await generateVideoFromText(prompt, {
            duration: `${duration}s` as any,
            aspectRatio: options.aspectRatio,
            resolution: options.resolution === '1080p' ? '1080p' : '720p',
            generateAudio: true
          });
        } else {
          callbacks.onProgress(segmentNumber, 4, `Generating continuation video (${duration}s)...`);
          videoResult = await generateVideoFromImage(lastFrameBlob, prompt, {
            duration: `${duration}s` as any,
            aspectRatio: options.aspectRatio,
            resolution: options.resolution === '1080p' ? '1080p' : '720p',
            generateAudio: true
          });
        }
      }

      // Create segment info
      const segment: VideoSegment = {
        segmentNumber,
        prompt,
        videoUrl: videoResult.video.url,
        duration
      };

      completedSegments.push(segment);
      callbacks.onSegmentComplete(segment);
      callbacks.onProgress(segmentNumber, 4, `Sequential segment ${segmentNumber} completed!`);

      // Extract last frame for next segment (except for the last one)
      if (i < segmentPrompts.length - 1) {
        callbacks.onProgress(segmentNumber, 4, `Preparing for next segment...`);
        try {
          lastFrameBlob = await extractLastFrameFromVideo(videoResult.video.url);
        } catch (frameError) {
          console.warn(`Could not extract frame from segment ${segmentNumber}:`, frameError);
          lastFrameBlob = null;
        }
      }

    } catch (error) {
      const segmentError = new Error(`Failed to generate segment ${segmentNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      callbacks.onError(segmentNumber, segmentError);

      const fallbackSegment: VideoSegment = {
        segmentNumber,
        prompt,
        videoUrl: "",
        duration
      };

      completedSegments.push(fallbackSegment);
      callbacks.onSegmentComplete(fallbackSegment);
    }
  }

  return completedSegments;
}

/**
 * Get optimal generation strategy based on duration and system capabilities
 */
export function getOptimalStrategy(
  duration: '8s' | '16s' | '30s',
  systemCapabilities?: {
    maxConcurrency?: number;
    preferContinuity?: boolean;
  }
): VideoGenerationStrategy {
  const { maxConcurrency = 4, preferContinuity = false } = systemCapabilities || {};

  // For very short videos, parallel generation is most efficient
  if (duration === '8s' && !preferContinuity) {
    return { type: 'parallel' };
  }

  // For medium videos, use hybrid approach
  if (duration === '16s') {
    return { type: 'hybrid', maxConcurrency: Math.min(maxConcurrency, 2) };
  }

  // For longer videos or when continuity is important, use sequential
  if (duration === '30s' || preferContinuity) {
    return { type: 'sequential' };
  }

  // Default to hybrid
  return { type: 'hybrid', maxConcurrency: 2 };
}

/**
 * Create placeholder segments with configurable duration
 */
export function createPlaceholderSegmentsWithDuration(duration: '8s' | '16s' | '30s'): VideoSegment[] {
  const durations = calculateSegmentDurations(duration);

  return [
    {
      segmentNumber: 1,
      prompt: "Introduction and overview",
      videoUrl: "",
      duration: durations[0]
    },
    {
      segmentNumber: 2,
      prompt: "Mechanism of action",
      videoUrl: "",
      duration: durations[1]
    },
    {
      segmentNumber: 3,
      prompt: "Therapeutic effects",
      videoUrl: "",
      duration: durations[2]
    },
    {
      segmentNumber: 4,
      prompt: "Safety and summary",
      videoUrl: "",
      duration: durations[3]
    }
  ];
}