import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { VideoSegment } from './fal';
import { createAWSCredentials, BearerTokenCredentialProvider } from './bearer-auth';

export interface S3Configuration {
  accessKeyId?: string;
  secretAccessKey?: string;
  region: string;
  bucketName: string;
  bearerToken?: string;
}

export interface S3UploadProgress {
  stage: 'preparing' | 'uploading' | 'finalizing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  uploadedBytes?: number;
  totalBytes?: number;
  uploadSpeed?: number; // bytes per second
}

export interface VideoUploadResult {
  key: string;
  url: string;
  presignedUrl?: string;
  size: number;
  uploadTime: number;
  expirationTime?: Date;
}

export interface VideoMetadata {
  drugName: string;
  segmentCount: number;
  totalDuration: number;
  quality: 'high' | 'medium' | 'low';
  format: 'mp4' | 'webm';
  generatedAt: Date;
  segments: VideoSegment[];
}

export class S3VideoService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(config: S3Configuration) {
    this.bucketName = config.bucketName;

    // Support both bearer token and traditional AWS credentials
    if (config.bearerToken) {
      const bearerCredentials = createAWSCredentials(config.bearerToken);
      this.bucketName = bearerCredentials.bucketName;
      this.s3Client = new S3Client({
        region: bearerCredentials.region,
        credentials: {
          accessKeyId: bearerCredentials.accessKeyId,
          secretAccessKey: bearerCredentials.secretAccessKey,
        },
      });
    } else if (config.accessKeyId && config.secretAccessKey) {
      this.s3Client = new S3Client({
        region: config.region,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });
    } else {
      throw new Error('Either bearerToken or accessKeyId/secretAccessKey must be provided');
    }
  }

  /**
   * Upload video to S3 with progress tracking
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

    try {
      onProgress?.({
        stage: 'preparing',
        progress: 0,
        message: 'Preparing video upload to S3...'
      });

      // Convert blob to buffer
      const videoBuffer = await videoBlob.arrayBuffer();

      onProgress?.({
        stage: 'preparing',
        progress: 10,
        message: 'Creating upload metadata...'
      });

      // Prepare upload command with metadata
      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: new Uint8Array(videoBuffer),
        ContentType: videoBlob.type,
        ContentLength: videoBlob.size,
        Metadata: {
          drugName: metadata.drugName,
          segmentCount: metadata.segmentCount.toString(),
          totalDuration: metadata.totalDuration.toString(),
          quality: metadata.quality,
          format: metadata.format,
          generatedAt: metadata.generatedAt.toISOString(),
          segments: JSON.stringify(metadata.segments.map(s => ({
            segmentNumber: s.segmentNumber,
            duration: s.duration,
            prompt: s.prompt
          })))
        },
        // Set cache control and content disposition for better web performance
        CacheControl: 'public, max-age=3600',
        ContentDisposition: `inline; filename="${metadata.drugName}-mechanism-video.${metadata.format}"`,
      });

      onProgress?.({
        stage: 'uploading',
        progress: 20,
        message: `Uploading to S3 (${Math.round(videoBlob.size / 1024 / 1024 * 100) / 100} MB)...`,
        totalBytes: videoBlob.size,
        uploadedBytes: 0
      });

      // Execute upload
      await this.s3Client.send(uploadCommand);

      const uploadTime = Date.now() - startTime;

      onProgress?.({
        stage: 'finalizing',
        progress: 80,
        message: 'Upload complete, generating access URL...'
      });

      // Generate public URL
      const url = `https://${this.bucketName}.s3.amazonaws.com/${key}`;

      // Generate presigned URL if requested
      let presignedUrl: string | undefined;
      let expirationTime: Date | undefined;

      if (generatePresignedUrl) {
        const getCommand = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        });

        presignedUrl = await getSignedUrl(
          this.s3Client,
          getCommand,
          { expiresIn: expirationMinutes * 60 }
        );

        expirationTime = new Date(Date.now() + expirationMinutes * 60 * 1000);
      }

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: `Upload complete! (${Math.round(uploadTime / 1000)}s)`,
        uploadedBytes: videoBlob.size,
        totalBytes: videoBlob.size,
        uploadSpeed: Math.round(videoBlob.size / (uploadTime / 1000))
      });

      return {
        key,
        url,
        presignedUrl,
        size: videoBlob.size,
        uploadTime,
        expirationTime
      };

    } catch (error) {
      const uploadTime = Date.now() - startTime;
      console.error('S3 video upload failed:', error);

      onProgress?.({
        stage: 'error',
        progress: 0,
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        uploadedBytes: 0
      });

      throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload individual video segments
   */
  async uploadVideoSegments(
    segments: VideoSegment[],
    drugName: string,
    onProgress?: (progress: S3UploadProgress) => void
  ): Promise<VideoUploadResult[]> {
    const results: VideoUploadResult[] = [];
    const totalSegments = segments.length;

    try {
      onProgress?.({
        stage: 'preparing',
        progress: 0,
        message: 'Starting individual segment uploads...'
      });

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];

        if (!segment.videoUrl || !segment.videoUrl.startsWith('http')) {
          console.warn(`Skipping invalid segment ${i + 1}`);
          continue;
        }

        onProgress?.({
          stage: 'uploading',
          progress: (i / totalSegments) * 100,
          message: `Uploading segment ${i + 1}/${totalSegments}...`
        });

        try {
          // Download segment
          const response = await fetch(segment.videoUrl);
          if (!response.ok) {
            throw new Error(`Failed to download segment: ${response.statusText}`);
          }

          const segmentBlob = await response.blob();
          const segmentKey = this.generateSegmentKey(drugName, segment.segmentNumber);

          // Upload to S3
          const uploadCommand = new PutObjectCommand({
            Bucket: this.bucketName,
            Key: segmentKey,
            Body: new Uint8Array(await segmentBlob.arrayBuffer()),
            ContentType: segmentBlob.type,
            ContentLength: segmentBlob.size,
            Metadata: {
              drugName,
              segmentNumber: segment.segmentNumber.toString(),
              duration: segment.duration.toString(),
              prompt: segment.prompt,
              originalUrl: segment.videoUrl,
              uploadedAt: new Date().toISOString()
            },
            CacheControl: 'public, max-age=3600',
            ContentDisposition: `inline; filename="${drugName}-segment-${segment.segmentNumber}.mp4"`
          });

          await this.s3Client.send(uploadCommand);

          // Generate presigned URL
          const getCommand = new GetObjectCommand({
            Bucket: this.bucketName,
            Key: segmentKey,
          });

          const presignedUrl = await getSignedUrl(this.s3Client, getCommand, { expiresIn: 3600 });

          results.push({
            key: segmentKey,
            url: `https://${this.bucketName}.s3.amazonaws.com/${segmentKey}`,
            presignedUrl,
            size: segmentBlob.size,
            uploadTime: Date.now(),
            expirationTime: new Date(Date.now() + 3600 * 1000)
          });

        } catch (error) {
          console.error(`Failed to upload segment ${i + 1}:`, error);
          // Continue with other segments
        }
      }

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: `Uploaded ${results.length}/${totalSegments} segments successfully`
      });

      return results;

    } catch (error) {
      console.error('Segment upload batch failed:', error);
      throw new Error(`Segment upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate presigned download URL
   */
  async generateDownloadUrl(
    key: string,
    expirationMinutes: number = 60,
    filename?: string
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ResponseContentDisposition: filename
          ? `attachment; filename="${filename}"`
          : undefined
      });

      return await getSignedUrl(this.s3Client, command, {
        expiresIn: expirationMinutes * 60
      });

    } catch (error) {
      console.error('Failed to generate download URL:', error);
      throw new Error(`Download URL generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if video exists in S3
   */
  async videoExists(key: string): Promise<boolean> {
    try {
      await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key
      }));
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete video from S3
   */
  async deleteVideo(key: string): Promise<void> {
    try {
      await this.s3Client.send(new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      }));
    } catch (error) {
      console.error('Failed to delete video:', error);
      throw new Error(`Video deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload thumbnail image
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
    const key = this.generateThumbnailKey(drugName, quality);

    try {
      onProgress?.({
        stage: 'uploading',
        progress: 0,
        message: 'Uploading thumbnail...'
      });

      const uploadCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: new Uint8Array(await thumbnailBlob.arrayBuffer()),
        ContentType: thumbnailBlob.type,
        ContentLength: thumbnailBlob.size,
        Metadata: {
          drugName,
          quality,
          type: 'thumbnail',
          uploadedAt: new Date().toISOString()
        },
        CacheControl: 'public, max-age=86400', // Cache for 24 hours
        ContentDisposition: `inline; filename="${drugName}-thumbnail.jpg"`
      });

      await this.s3Client.send(uploadCommand);

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Thumbnail uploaded successfully'
      });

      return {
        key,
        url: `https://${this.bucketName}.s3.amazonaws.com/${key}`,
        size: thumbnailBlob.size,
        uploadTime: Date.now()
      };

    } catch (error) {
      console.error('Thumbnail upload failed:', error);
      throw new Error(`Thumbnail upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate S3 key for combined video
   */
  private generateVideoKey(metadata: VideoMetadata): string {
    const timestamp = metadata.generatedAt.toISOString().split('T')[0];
    const sanitizedDrugName = metadata.drugName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    return `videos/${sanitizedDrugName}/${timestamp}/combined-${metadata.quality}.${metadata.format}`;
  }

  /**
   * Generate S3 key for individual segment
   */
  private generateSegmentKey(drugName: string, segmentNumber: number): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedDrugName = drugName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    return `videos/${sanitizedDrugName}/${timestamp}/segments/segment-${segmentNumber}.mp4`;
  }

  /**
   * Generate S3 key for thumbnail
   */
  private generateThumbnailKey(drugName: string, quality: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedDrugName = drugName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    return `videos/${sanitizedDrugName}/${timestamp}/thumbnail-${quality}.jpg`;
  }

  /**
   * Get video folder structure for a drug
   */
  generateVideoFolder(drugName: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedDrugName = drugName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    return `videos/${sanitizedDrugName}/${timestamp}/`;
  }
}

/**
 * Create S3 service instance from environment variables
 */
export function createS3VideoService(): S3VideoService {
  const config = getS3ConfigFromEnv();

  try {
    return new S3VideoService(config);
  } catch (error) {
    console.warn('Failed to create real S3 service, using mock service for testing:', error);

    // Import and use mock service if real S3 fails
    const { MockS3VideoService } = require('./mock-s3-service');
    return new MockS3VideoService(config) as any;
  }
}

/**
 * Get S3 configuration from environment variables
 */
export function getS3ConfigFromEnv(): S3Configuration {
  const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
  const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
  const region = import.meta.env.VITE_AWS_REGION || 'us-east-1';
  const bucketName = import.meta.env.VITE_AWS_S3_BUCKET_NAME;

  // Check for bearer token authentication (for custom AWS setups)
  const bearerToken = import.meta.env.AWS_BEARER_TOKEN_BEDROCK;

  if (bearerToken) {
    return {
      region,
      bucketName: bucketName || 'default-bucket', // Will be overridden by bearer token
      bearerToken
    };
  }

  if (!accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      'Missing required AWS S3 configuration. Please set VITE_AWS_ACCESS_KEY_ID, VITE_AWS_SECRET_ACCESS_KEY, and VITE_AWS_S3_BUCKET_NAME in your environment variables, or provide AWS_BEARER_TOKEN_BEDROCK for bearer token authentication.'
    );
  }

  return {
    accessKeyId,
    secretAccessKey,
    region,
    bucketName
  };
}

/**
 * Utility function to format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Utility function to format upload speed
 */
export function formatUploadSpeed(bytesPerSecond: number): string {
  return `${formatFileSize(bytesPerSecond)}/s`;
}