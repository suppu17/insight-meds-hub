import { generateVideoFromText, generateVideoFromImage, extractLastFrameFromVideo, VideoSegment } from './fal';

export interface SegmentGenerationCallback {
  onSegmentStart: (segmentNumber: number) => void;
  onSegmentComplete: (segment: VideoSegment) => void;
  onProgress: (segmentNumber: number, total: number, message: string) => void;
  onError: (segmentNumber: number, error: Error) => void;
}

/**
 * Enhanced video generation that shows segments as they complete
 * This replaces the original generateChainedVideo with better UX
 */
export async function generateVideoSegmentsWithPreviews(
  drugName: string,
  segmentPrompts: string[],
  callbacks: SegmentGenerationCallback
): Promise<VideoSegment[]> {
  if (segmentPrompts.length !== 4) {
    throw new Error("Exactly 4 segment prompts are required for 30-second video");
  }

  const completedSegments: VideoSegment[] = [];
  let lastFrameBlob: Blob | null = null;

  try {
    for (let i = 0; i < segmentPrompts.length; i++) {
      const segmentNumber = i + 1;
      const prompt = segmentPrompts[i];

      // Notify segment generation started
      callbacks.onSegmentStart(segmentNumber);
      callbacks.onProgress(segmentNumber, 4, `Starting segment ${segmentNumber}/4...`);

      try {
        let videoResult;

        if (i === 0) {
          // First segment: text-to-video
          callbacks.onProgress(segmentNumber, 4, `Generating introduction video...`);
          videoResult = await generateVideoFromText(prompt, {
            duration: "8s",
            aspectRatio: "16:9",
            resolution: "720p",
            generateAudio: true
          });
        } else {
          // Subsequent segments: image-to-video using last frame
          if (!lastFrameBlob) {
            throw new Error(`Missing last frame for segment ${segmentNumber}`);
          }

          callbacks.onProgress(segmentNumber, 4, `Generating continuation video...`);
          videoResult = await generateVideoFromImage(lastFrameBlob, prompt, {
            duration: segmentNumber === 4 ? "6s" : "8s", // Last segment is shorter for 30s total
            aspectRatio: "16:9",
            resolution: "720p",
            generateAudio: true
          });
        }

        // Create segment info
        const segment: VideoSegment = {
          segmentNumber,
          prompt,
          videoUrl: videoResult.video.url,
          duration: segmentNumber === 4 ? 6 : 8
        };

        // Add to completed segments
        completedSegments.push(segment);

        // Notify segment completion immediately
        callbacks.onSegmentComplete(segment);
        callbacks.onProgress(segmentNumber, 4, `Segment ${segmentNumber} completed!`);

        // Extract last frame for next segment (except for the last one)
        if (i < segmentPrompts.length - 1) {
          callbacks.onProgress(segmentNumber, 4, `Preparing for next segment...`);
          lastFrameBlob = await extractLastFrameFromVideo(videoResult.video.url);
        }

      } catch (error) {
        const segmentError = new Error(`Failed to generate segment ${segmentNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        callbacks.onError(segmentNumber, segmentError);

        // Create a fallback placeholder segment
        const fallbackSegment: VideoSegment = {
          segmentNumber,
          prompt,
          videoUrl: "", // Empty URL indicates failed segment
          duration: segmentNumber === 4 ? 6 : 8
        };

        completedSegments.push(fallbackSegment);

        // Notify about the failed segment with placeholder
        callbacks.onSegmentComplete(fallbackSegment);

        // Continue with remaining segments even if one fails
        // Try to extract a frame from the last successful segment if available
        if (completedSegments.length > 1 && i < segmentPrompts.length - 1) {
          const lastSuccessfulSegment = completedSegments
            .slice(0, -1) // Exclude the failed segment we just added
            .reverse()
            .find(seg => seg.videoUrl && seg.videoUrl.startsWith('http'));

          if (lastSuccessfulSegment) {
            try {
              lastFrameBlob = await extractLastFrameFromVideo(lastSuccessfulSegment.videoUrl);
            } catch (frameError) {
              console.warn(`Could not extract frame from segment ${lastSuccessfulSegment.segmentNumber}:`, frameError);
              lastFrameBlob = null;
            }
          }
        }

        continue;
      }
    }

    return completedSegments;

  } catch (error) {
    throw new Error(`Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create placeholder segments for UI display before generation starts
 */
export function createPlaceholderSegments(): VideoSegment[] {
  return [
    {
      segmentNumber: 1,
      prompt: "Introduction and overview",
      videoUrl: "",
      duration: 8
    },
    {
      segmentNumber: 2,
      prompt: "Mechanism of action",
      videoUrl: "",
      duration: 8
    },
    {
      segmentNumber: 3,
      prompt: "Therapeutic effects",
      videoUrl: "",
      duration: 8
    },
    {
      segmentNumber: 4,
      prompt: "Safety and summary",
      videoUrl: "",
      duration: 6
    }
  ];
}

/**
 * Get the current generation status for each segment
 */
export function getSegmentGenerationStatus(
  placeholderSegments: VideoSegment[],
  completedSegments: VideoSegment[],
  currentSegment: number
): Array<{
  segment: VideoSegment;
  status: 'pending' | 'generating' | 'completed' | 'error';
  isCompleted: boolean;
  isGenerating: boolean;
}> {
  return placeholderSegments.map((placeholderSegment) => {
    const completedSegment = completedSegments.find(
      (completed) => completed.segmentNumber === placeholderSegment.segmentNumber
    );

    const isCompleted = !!completedSegment;
    const isGenerating = currentSegment === placeholderSegment.segmentNumber && !isCompleted;

    let status: 'pending' | 'generating' | 'completed' | 'error' = 'pending';
    if (isCompleted) {
      status = 'completed';
    } else if (isGenerating) {
      status = 'generating';
    }

    return {
      segment: completedSegment || placeholderSegment,
      status,
      isCompleted,
      isGenerating
    };
  });
}