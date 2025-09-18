/**
 * Mock S3 Service for testing enhanced video system
 * This simulates S3 functionality for demonstration purposes
 */

import type { S3Configuration, S3UploadProgress, VideoUploadResult, VideoMetadata } from './s3-service';

export class MockS3VideoService {
  private config: S3Configuration;

  constructor(config: S3Configuration) {
    this.config = config;
    console.log('🎭 Using Mock S3 Service - simulating S3 functionality');
  }

  /**
   * Mock upload video to S3 with progress tracking
   */
  async uploadVideo(
    videoBlob: Blob,
    metadata: VideoMetadata,
    options: {
      key?: string;
      generatePresignedUrl?: boolean;
      expirationMinutes?: number;
      onProgress?: (progress: S3UploadProgress) => void;
    } = {}
  ): Promise<VideoUploadResult> {
    const {
      key = this.generateVideoKey(metadata),
      generatePresignedUrl = true,
      expirationMinutes = 60,
      onProgress
    } = options;

    const startTime = Date.now();

    // Simulate upload progress
    const simulateProgress = async () => {
      const stages = [
        { progress: 0, message: 'Preparing upload to S3...', stage: 'preparing' as const },
        { progress: 25, message: 'Uploading video to cloud storage...', stage: 'uploading' as const },
        { progress: 50, message: 'Processing video metadata...', stage: 'uploading' as const },
        { progress: 75, message: 'Generating secure download URLs...', stage: 'finalizing' as const },
        { progress: 100, message: 'Upload complete! Video stored in cloud.', stage: 'complete' as const }
      ];

      for (const stage of stages) {
        onProgress?.(stage);
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate upload time
      }
    };

    await simulateProgress();

    const uploadTime = Date.now() - startTime;

    // Generate mock URLs
    const baseUrl = `https://${this.config.bucketName}.s3.${this.config.region}.amazonaws.com`;
    const publicUrl = `${baseUrl}/${key}`;
    const presignedUrl = generatePresignedUrl
      ? `${publicUrl}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=MOCK%2F20240918%2F${this.config.region}%2Fs3%2Faws4_request&X-Amz-Date=20240918T000000Z&X-Amz-Expires=${expirationMinutes * 60}&X-Amz-SignedHeaders=host&X-Amz-Signature=mock-signature-${Date.now()}`
      : undefined;

    const result: VideoUploadResult = {
      key,
      url: publicUrl,
      presignedUrl,
      size: videoBlob.size,
      uploadTime,
      expirationTime: generatePresignedUrl
        ? new Date(Date.now() + expirationMinutes * 60 * 1000)
        : undefined
    };

    // Store in localStorage for testing
    const mockStorage = localStorage.getItem('mock-s3-videos') || '{}';
    const storage = JSON.parse(mockStorage);
    storage[key] = {
      size: videoBlob.size,
      uploadTime: new Date().toISOString(),
      metadata,
      blob: videoBlob // In real S3, this would be stored remotely
    };
    localStorage.setItem('mock-s3-videos', JSON.stringify(storage));

    console.log('🎭 Mock S3 Upload Complete:', {
      key,
      size: videoBlob.size,
      uploadTime,
      presignedUrl: !!presignedUrl
    });

    return result;
  }

  /**
   * Mock upload thumbnail
   */
  async uploadThumbnail(
    thumbnailBlob: Blob,
    drugName: string,
    options: {
      quality?: string;
      onProgress?: (progress: S3UploadProgress) => void;
    } = {}
  ): Promise<VideoUploadResult> {
    const { quality = 'medium', onProgress } = options;

    onProgress?.({
      stage: 'preparing',
      progress: 0,
      message: 'Preparing thumbnail upload...'
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Thumbnail uploaded successfully'
    });

    const key = this.generateThumbnailKey(drugName, quality);

    return {
      key,
      url: `https://${this.config.bucketName}.s3.${this.config.region}.amazonaws.com/${key}`,
      size: thumbnailBlob.size,
      uploadTime: 100
    };
  }

  /**
   * Mock batch upload segments
   */
  async uploadSegmentsBatch(
    segments: Array<{ blob: Blob; metadata: any }>,
    onProgress?: (progress: S3UploadProgress) => void
  ): Promise<VideoUploadResult[]> {
    const results: VideoUploadResult[] = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      onProgress?.({
        stage: 'uploading',
        progress: Math.round(((i + 1) / segments.length) * 100),
        message: `Uploading segment ${i + 1}/${segments.length}...`
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      const key = `segments/segment-${i + 1}-${Date.now()}.mp4`;
      results.push({
        key,
        url: `https://${this.config.bucketName}.s3.${this.config.region}.amazonaws.com/${key}`,
        size: segment.blob.size,
        uploadTime: 50
      });
    }

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: `All ${segments.length} segments uploaded successfully`
    });

    return results;
  }

  /**
   * Generate video key for organized storage
   */
  private generateVideoKey(metadata: VideoMetadata): string {
    const timestamp = metadata.generatedAt.toISOString().split('T')[0];
    const sanitizedDrugName = metadata.drugName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    return `videos/${sanitizedDrugName}/${timestamp}/combined-${metadata.quality}.${metadata.format}`;
  }

  /**
   * Generate thumbnail key
   */
  private generateThumbnailKey(drugName: string, quality: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedDrugName = drugName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    return `thumbnails/${sanitizedDrugName}/${timestamp}/thumb-${quality}.jpg`;
  }

  /**
   * Mock generate download URL
   */
  async generateDownloadUrl(
    key: string,
    expirationMinutes: number = 60,
    filename?: string
  ): Promise<string> {
    const baseUrl = `https://${this.config.bucketName}.s3.${this.config.region}.amazonaws.com`;
    const downloadParams = filename ? `&response-content-disposition=attachment; filename="${filename}"` : '';

    return `${baseUrl}/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=${expirationMinutes * 60}${downloadParams}&X-Amz-Signature=mock-${Date.now()}`;
  }

  /**
   * Mock list stored videos
   */
  async listStoredVideos(): Promise<string[]> {
    const mockStorage = localStorage.getItem('mock-s3-videos') || '{}';
    const storage = JSON.parse(mockStorage);
    return Object.keys(storage);
  }
}

/**
 * Create mock S3 service if real credentials are not available
 */
export function createMockS3Service(config: S3Configuration): MockS3VideoService {
  return new MockS3VideoService(config);
}