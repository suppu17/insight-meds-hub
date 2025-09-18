import { createS3VideoService, formatFileSize } from './s3-service';
import { getFFmpegProcessor } from './ffmpeg-processor';
import type { EnhancedVideoResult } from './enhanced-video-manager';
import type { VideoSegment } from './fal';

export interface DownloadOptions {
  format: 'mp4' | 'webm' | 'original';
  quality: 'high' | 'medium' | 'low' | 'original';
  source: 'direct' | 's3' | 'auto';
  filename?: string;
  includeMetadata?: boolean;
}

export interface DownloadProgress {
  stage: 'preparing' | 'processing' | 'downloading' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  downloadedBytes?: number;
  totalBytes?: number;
  downloadSpeed?: number; // bytes per second
}

export interface DownloadResult {
  success: boolean;
  filename: string;
  size: number;
  source: 'direct' | 's3' | 'converted';
  downloadTime: number;
  url?: string;
  error?: string;
}

export interface BatchDownloadResult {
  downloads: DownloadResult[];
  totalSize: number;
  totalTime: number;
  successCount: number;
  failureCount: number;
}

export class VideoDownloadManager {
  private s3Service?: ReturnType<typeof createS3VideoService>;

  constructor() {
    try {
      this.s3Service = createS3VideoService();
    } catch (error) {
      console.warn('S3 service not available for downloads:', error);
    }
  }

  /**
   * Download main video with format/quality options
   */
  async downloadVideo(
    videoResult: EnhancedVideoResult,
    options: DownloadOptions = {
      format: 'original',
      quality: 'original',
      source: 'auto',
      includeMetadata: true
    },
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<DownloadResult> {
    const startTime = Date.now();

    try {
      onProgress?.({
        stage: 'preparing',
        progress: 0,
        message: 'Preparing video download...'
      });

      // Determine source and get video blob
      let videoBlob = videoResult.videoBlob;
      let downloadSource: 'direct' | 's3' | 'converted' = 'direct';

      // Check if we should use S3
      if ((options.source === 's3' || options.source === 'auto') && videoResult.s3Upload) {
        if (options.source === 's3' || !videoBlob || videoBlob.size === 0) {
          onProgress?.({
            stage: 'downloading',
            progress: 10,
            message: 'Downloading from S3...'
          });

          try {
            const s3Url = videoResult.s3Upload.presignedUrl || videoResult.s3Upload.url;
            const response = await fetch(s3Url);

            if (!response.ok) {
              throw new Error(`S3 download failed: ${response.statusText}`);
            }

            videoBlob = await response.blob();
            downloadSource = 's3';

          } catch (s3Error) {
            console.warn('S3 download failed, using direct blob:', s3Error);
            videoBlob = videoResult.videoBlob;
            downloadSource = 'direct';
          }
        }
      }

      // Check if format conversion is needed
      const needsConversion = (
        options.format !== 'original' &&
        options.format !== videoResult.format
      ) || (
        options.quality !== 'original' &&
        options.quality !== videoResult.quality
      );

      if (needsConversion) {
        onProgress?.({
          stage: 'processing',
          progress: 20,
          message: `Converting to ${options.format} (${options.quality} quality)...`
        });

        const processor = getFFmpegProcessor();

        if (options.format !== 'original' && options.format !== videoResult.format) {
          videoBlob = await processor.convertVideo(
            videoBlob,
            options.format,
            options.quality === 'original' ? 'medium' : options.quality,
            (ffmpegProgress) => {
              onProgress?.({
                stage: 'processing',
                progress: 20 + (ffmpegProgress.progress / 100) * 60,
                message: ffmpegProgress.message
              });
            }
          );
          downloadSource = 'converted';
        }
      }

      onProgress?.({
        stage: 'downloading',
        progress: 80,
        message: 'Preparing download...'
      });

      // Generate filename
      const filename = this.generateFilename(videoResult, options);

      // Trigger download
      await this.triggerDownload(videoBlob, filename, onProgress);

      const downloadTime = Date.now() - startTime;

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: `Download complete! (${formatFileSize(videoBlob.size)})`,
        totalBytes: videoBlob.size,
        downloadedBytes: videoBlob.size
      });

      return {
        success: true,
        filename,
        size: videoBlob.size,
        source: downloadSource,
        downloadTime,
        url: URL.createObjectURL(videoBlob)
      };

    } catch (error) {
      const downloadTime = Date.now() - startTime;
      console.error('Video download failed:', error);

      onProgress?.({
        stage: 'error',
        progress: 0,
        message: `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });

      return {
        success: false,
        filename: options.filename || 'video',
        size: 0,
        source: 'direct',
        downloadTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Download individual video segments as a ZIP
   */
  async downloadSegments(
    segments: VideoSegment[],
    drugName: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<BatchDownloadResult> {
    const startTime = Date.now();
    const downloads: DownloadResult[] = [];

    try {
      onProgress?.({
        stage: 'preparing',
        progress: 0,
        message: 'Preparing segment downloads...'
      });

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];

        onProgress?.({
          stage: 'downloading',
          progress: (i / segments.length) * 100,
          message: `Downloading segment ${i + 1}/${segments.length}...`
        });

        try {
          if (segment.videoUrl && segment.videoUrl.startsWith('http')) {
            const response = await fetch(segment.videoUrl);

            if (response.ok) {
              const blob = await response.blob();
              const filename = `${drugName}-segment-${segment.segmentNumber}.mp4`;

              await this.triggerDownload(blob, filename);

              downloads.push({
                success: true,
                filename,
                size: blob.size,
                source: 'direct',
                downloadTime: Date.now() - startTime,
                url: segment.videoUrl
              });
            } else {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
          } else {
            throw new Error('Invalid segment URL');
          }

        } catch (error) {
          downloads.push({
            success: false,
            filename: `${drugName}-segment-${segment.segmentNumber}.mp4`,
            size: 0,
            source: 'direct',
            downloadTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const totalTime = Date.now() - startTime;
      const successCount = downloads.filter(d => d.success).length;
      const totalSize = downloads.reduce((sum, d) => sum + d.size, 0);

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: `Downloaded ${successCount}/${segments.length} segments (${formatFileSize(totalSize)})`
      });

      return {
        downloads,
        totalSize,
        totalTime,
        successCount,
        failureCount: downloads.length - successCount
      };

    } catch (error) {
      console.error('Batch segment download failed:', error);

      onProgress?.({
        stage: 'error',
        progress: 0,
        message: `Batch download failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });

      return {
        downloads,
        totalSize: 0,
        totalTime: Date.now() - startTime,
        successCount: 0,
        failureCount: segments.length
      };
    }
  }

  /**
   * Generate S3 presigned URL for sharing
   */
  async generateShareUrl(
    videoResult: EnhancedVideoResult,
    expirationMinutes: number = 60
  ): Promise<string | null> {
    if (!this.s3Service || !videoResult.s3Upload) {
      return null;
    }

    try {
      return await this.s3Service.generateDownloadUrl(
        videoResult.s3Upload.key,
        expirationMinutes,
        this.generateFilename(videoResult, { format: 'original', quality: 'original', source: 's3' })
      );
    } catch (error) {
      console.error('Failed to generate share URL:', error);
      return null;
    }
  }

  /**
   * Create download package with multiple formats/qualities
   */
  async createDownloadPackage(
    videoResult: EnhancedVideoResult,
    formats: Array<{
      format: 'mp4' | 'webm';
      quality: 'high' | 'medium' | 'low';
      label: string;
    }>,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<BatchDownloadResult> {
    const startTime = Date.now();
    const downloads: DownloadResult[] = [];

    try {
      onProgress?.({
        stage: 'preparing',
        progress: 0,
        message: 'Creating download package with multiple formats...'
      });

      for (let i = 0; i < formats.length; i++) {
        const formatConfig = formats[i];

        onProgress?.({
          stage: 'processing',
          progress: (i / formats.length) * 100,
          message: `Creating ${formatConfig.label} version...`
        });

        try {
          const downloadResult = await this.downloadVideo(
            videoResult,
            {
              format: formatConfig.format,
              quality: formatConfig.quality,
              source: 'auto',
              filename: `${videoResult.drugAnalysis.drugName}-${formatConfig.label.replace(/\s+/g, '-').toLowerCase()}`
            },
            (downloadProgress) => {
              onProgress?.({
                stage: 'processing',
                progress: (i / formats.length) * 100 + (downloadProgress.progress / formats.length / 100) * 100,
                message: `${formatConfig.label}: ${downloadProgress.message}`
              });
            }
          );

          downloads.push(downloadResult);

        } catch (error) {
          downloads.push({
            success: false,
            filename: `${videoResult.drugAnalysis.drugName}-${formatConfig.label}`,
            size: 0,
            source: 'converted',
            downloadTime: Date.now() - startTime,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const totalTime = Date.now() - startTime;
      const successCount = downloads.filter(d => d.success).length;
      const totalSize = downloads.reduce((sum, d) => sum + d.size, 0);

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: `Package created: ${successCount}/${formats.length} formats (${formatFileSize(totalSize)})`
      });

      return {
        downloads,
        totalSize,
        totalTime,
        successCount,
        failureCount: downloads.length - successCount
      };

    } catch (error) {
      console.error('Download package creation failed:', error);

      return {
        downloads,
        totalSize: 0,
        totalTime: Date.now() - startTime,
        successCount: 0,
        failureCount: formats.length
      };
    }
  }

  /**
   * Trigger browser download
   */
  private async triggerDownload(
    blob: Blob,
    filename: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    try {
      onProgress?.({
        stage: 'downloading',
        progress: 90,
        message: 'Starting download...'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download = filename;
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Clean up URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      onProgress?.({
        stage: 'downloading',
        progress: 100,
        message: 'Download started'
      });

    } catch (error) {
      console.error('Failed to trigger download:', error);
      throw new Error(`Download trigger failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate appropriate filename
   */
  private generateFilename(
    videoResult: EnhancedVideoResult,
    options: DownloadOptions
  ): string {
    if (options.filename) {
      return options.filename;
    }

    const drugName = videoResult.drugAnalysis.drugName
      .replace(/[^a-zA-Z0-9-]/g, '-')
      .toLowerCase();

    const quality = options.quality === 'original' ? videoResult.quality : options.quality;
    const format = options.format === 'original' ? videoResult.format : options.format;

    const timestamp = videoResult.generatedAt.toISOString().split('T')[0];

    return `${drugName}-mechanism-video-${quality}.${format}`;
  }

  /**
   * Get download size estimate
   */
  getDownloadSizeEstimate(
    videoResult: EnhancedVideoResult,
    format: 'mp4' | 'webm' | 'original' = 'original',
    quality: 'high' | 'medium' | 'low' | 'original' = 'original'
  ): number {
    // Base size from current video
    let baseSize = videoResult.videoBlob.size;

    // Adjust for format conversion
    if (format !== 'original' && format !== videoResult.format) {
      if (format === 'mp4' && videoResult.format === 'webm') {
        baseSize *= 1.2; // MP4 typically larger than WebM
      } else if (format === 'webm' && videoResult.format === 'mp4') {
        baseSize *= 0.8; // WebM typically smaller than MP4
      }
    }

    // Adjust for quality
    if (quality !== 'original' && quality !== videoResult.quality) {
      const qualityMultipliers = {
        high: 1.5,
        medium: 1.0,
        low: 0.6
      };

      const currentMultiplier = qualityMultipliers[videoResult.quality] || 1.0;
      const targetMultiplier = qualityMultipliers[quality] || 1.0;

      baseSize *= (targetMultiplier / currentMultiplier);
    }

    return Math.round(baseSize);
  }

  /**
   * Check if format conversion is supported
   */
  isConversionSupported(
    fromFormat: string,
    toFormat: string,
    fromQuality: string,
    toQuality: string
  ): boolean {
    // Check if FFmpeg is available for conversion
    try {
      getFFmpegProcessor();
      return true;
    } catch (error) {
      // Only allow downloads of original format/quality if FFmpeg is not available
      return toFormat === 'original' && toQuality === 'original';
    }
  }
}

// Singleton instance
let downloadManager: VideoDownloadManager | null = null;

/**
 * Get or create download manager singleton
 */
export function getDownloadManager(): VideoDownloadManager {
  if (!downloadManager) {
    downloadManager = new VideoDownloadManager();
  }
  return downloadManager;
}

/**
 * Quick download function
 */
export async function downloadVideoFile(
  videoResult: EnhancedVideoResult,
  options: Partial<DownloadOptions> = {},
  onProgress?: (progress: DownloadProgress) => void
): Promise<DownloadResult> {
  const manager = getDownloadManager();

  const fullOptions: DownloadOptions = {
    format: 'original',
    quality: 'original',
    source: 'auto',
    includeMetadata: true,
    ...options
  };

  return manager.downloadVideo(videoResult, fullOptions, onProgress);
}

/**
 * Create share URL
 */
export async function createShareUrl(
  videoResult: EnhancedVideoResult,
  expirationMinutes: number = 60
): Promise<string | null> {
  const manager = getDownloadManager();
  return manager.generateShareUrl(videoResult, expirationMinutes);
}