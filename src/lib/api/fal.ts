import { fal } from "@fal-ai/client";

// Configure fal.ai client
fal.config({
  credentials: import.meta.env.VITE_FAL_API_KEY || ""
});

export interface VideoGenerationResult {
  video: {
    url: string;
    content_type?: string;
    file_name?: string;
    file_size?: number;
  };
}

export interface ImageGenerationResult {
  images: Array<{
    url: string;
    content_type?: string;
    file_name?: string;
    file_size?: number;
  }>;
  description?: string;
}

export interface VideoSegment {
  segmentNumber: number;
  prompt: string;
  videoUrl: string;
  duration: number;
}

/**
 * Generate a video segment using text-to-video
 */
export async function generateVideoFromText(
  prompt: string,
  options?: {
    duration?: "4s" | "6s" | "8s";
    aspectRatio?: "16:9" | "9:16" | "1:1";
    resolution?: "720p" | "1080p";
    enhancePrompt?: boolean;
    generateAudio?: boolean;
  }
): Promise<VideoGenerationResult> {
  try {
    const result = await fal.subscribe("fal-ai/veo3/fast", {
      input: {
        prompt,
        duration: options?.duration || "8s",
        aspect_ratio: options?.aspectRatio || "16:9",
        resolution: options?.resolution || "720p",
        enhance_prompt: options?.enhancePrompt ?? true,
        generate_audio: options?.generateAudio ?? true,
        auto_fix: true
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("Video generation progress:", update.logs?.map(log => log.message).join(" "));
        }
      },
    });

    return result.data as VideoGenerationResult;
  } catch (error) {
    console.error("Error generating video from text:", error);
    throw new Error(`Failed to generate video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a video segment using image-to-video (for chaining)
 */
export async function generateVideoFromImage(
  imageBlob: Blob,
  prompt: string,
  options?: {
    duration?: "4s" | "6s" | "8s";
    aspectRatio?: "16:9" | "9:16" | "1:1";
    resolution?: "720p" | "1080p";
    enhancePrompt?: boolean;
    generateAudio?: boolean;
  }
): Promise<VideoGenerationResult> {
  try {
    // Upload the image first
    const imageUrl = await fal.storage.upload(imageBlob);

    const result = await fal.subscribe("fal-ai/veo3/fast", {
      input: {
        prompt,
        image_url: imageUrl,
        duration: options?.duration || "8s",
        aspect_ratio: options?.aspectRatio || "16:9",
        resolution: options?.resolution || "720p",
        enhance_prompt: options?.enhancePrompt ?? true,
        generate_audio: options?.generateAudio ?? true,
        auto_fix: true
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("Video generation progress:", update.logs?.map(log => log.message).join(" "));
        }
      },
    });

    return result.data as VideoGenerationResult;
  } catch (error) {
    console.error("Error generating video from image:", error);
    throw new Error(`Failed to generate video from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate educational images for drug mechanisms
 */
export async function generateMechanismImage(
  prompt: string,
  options?: {
    numImages?: number;
    outputFormat?: "jpeg" | "png";
  }
): Promise<ImageGenerationResult> {
  try {
    const result = await fal.subscribe("fal-ai/nano-banana", {
      input: {
        prompt,
        num_images: options?.numImages || 1,
        output_format: options?.outputFormat || "jpeg"
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("Image generation progress:", update.logs?.map(log => log.message).join(" "));
        }
      },
    });

    return result.data as ImageGenerationResult;
  } catch (error) {
    console.error("Error generating mechanism image:", error);
    throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a complete 30-second video by chaining 4 segments
 */
export async function generateChainedVideo(
  drugName: string,
  segmentPrompts: string[],
  onProgress?: (stage: number, total: number, message: string) => void
): Promise<VideoSegment[]> {
  if (segmentPrompts.length !== 4) {
    throw new Error("Exactly 4 segment prompts are required for 30-second video");
  }

  const segments: VideoSegment[] = [];
  let lastFrameBlob: Blob | null = null;

  try {
    for (let i = 0; i < segmentPrompts.length; i++) {
      const segmentNumber = i + 1;
      const prompt = segmentPrompts[i];

      onProgress?.(segmentNumber, 4, `Generating video segment ${segmentNumber}/4...`);

      let videoResult: VideoGenerationResult;

      if (i === 0) {
        // First segment: text-to-video
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

        videoResult = await generateVideoFromImage(lastFrameBlob, prompt, {
          duration: segmentNumber === 4 ? "6s" : "8s", // Last segment is shorter for 30s total
          aspectRatio: "16:9",
          resolution: "720p",
          generateAudio: true
        });
      }

      // Store segment info
      segments.push({
        segmentNumber,
        prompt,
        videoUrl: videoResult.video.url,
        duration: segmentNumber === 4 ? 6 : 8
      });

      // Extract last frame for next segment (except for the last one)
      if (i < segmentPrompts.length - 1) {
        onProgress?.(segmentNumber, 4, `Extracting frame for next segment...`);
        lastFrameBlob = await extractLastFrameFromVideo(videoResult.video.url);
      }
    }

    return segments;
  } catch (error) {
    console.error("Error in chained video generation:", error);
    throw new Error(`Failed to generate chained video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract the last frame from a video URL
 */
export async function extractLastFrameFromVideo(videoUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';

    video.addEventListener('loadedmetadata', () => {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Seek to last frame (slightly before the end to ensure we get a frame)
      video.currentTime = Math.max(0, video.duration - 0.1);
    });

    video.addEventListener('seeked', () => {
      try {
        // Draw the current frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          'image/jpeg',
          0.9
        );
      } catch (error) {
        reject(new Error(`Failed to draw video frame: ${error}`));
      }
    });

    video.addEventListener('error', (e) => {
      reject(new Error(`Video loading error: ${e}`));
    });

    // Load the video
    video.src = videoUrl;
  });
}