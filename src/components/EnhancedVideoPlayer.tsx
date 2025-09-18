import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  Download,
  Share2,
  Settings,
  SkipBack,
  SkipForward,
  Cloud,
  FileVideo,
  Loader2,
  CheckCircle,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import type { EnhancedVideoResult } from "@/lib/api/enhanced-video-manager";
import { downloadVideoFile, createShareUrl, getDownloadManager } from "@/lib/api/download-manager";
import { formatFileSize } from "@/lib/api/s3-service";

interface EnhancedVideoPlayerProps {
  videoResult: EnhancedVideoResult;
  title?: string;
  description?: string;
  showDownloadOptions?: boolean;
  showS3Info?: boolean;
}

interface DownloadState {
  isDownloading: boolean;
  progress: number;
  message: string;
  error?: string;
}

const EnhancedVideoPlayer = ({
  videoResult,
  title = "Drug Mechanism Explanation",
  description = "AI-generated educational video",
  showDownloadOptions = true,
  showS3Info = true
}: EnhancedVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [currentChapter, setCurrentChapter] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [downloadState, setDownloadState] = useState<DownloadState>({
    isDownloading: false,
    progress: 0,
    message: ''
  });
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // Create chapters based on segments
  const chapters = videoResult.segments.map((segment, index) => {
    const startTime = videoResult.segments.slice(0, index).reduce((sum, s) => sum + s.duration, 0);
    return {
      id: `chapter-${index}`,
      title: `Segment ${index + 1}`,
      startTime,
      endTime: startTime + segment.duration,
      description: getChapterDescription(index)
    };
  });

  function getChapterDescription(index: number): string {
    const descriptions = [
      "Introduction and Overview",
      "Mechanism of Action",
      "Therapeutic Effects",
      "Safety and Summary"
    ];
    return descriptions[index] || `Segment ${index + 1}`;
  }

  // Initialize video URL
  useEffect(() => {
    const url = URL.createObjectURL(videoResult.videoBlob);
    setVideoUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [videoResult.videoBlob]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      const newChapter = chapters.findIndex(
        (chapter) => video.currentTime >= chapter.startTime && video.currentTime < chapter.endTime
      );
      if (newChapter !== -1 && newChapter !== currentChapter) {
        setCurrentChapter(newChapter);
      }
    };

    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('ended', handleEnded);
    };
  }, [chapters, currentChapter]);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const hideControls = () => {
      timeout = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    if (isPlaying) {
      hideControls();
    } else {
      setShowControls(true);
    }

    return () => clearTimeout(timeout);
  }, [isPlaying]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0] / 100;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = (value[0] / 100) * videoResult.duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skipToChapter = (chapterIndex: number) => {
    const video = videoRef.current;
    if (!video || !chapters[chapterIndex]) return;

    video.currentTime = chapters[chapterIndex].startTime;
    setCurrentChapter(chapterIndex);
  };

  const skipTime = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(videoResult.duration, video.currentTime + seconds));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const restart = () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    setCurrentTime(0);
    setCurrentChapter(0);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Enhanced download functions
  const handleDownload = async (format: 'mp4' | 'webm' | 'original', quality: 'high' | 'medium' | 'low' | 'original') => {
    setDownloadState({
      isDownloading: true,
      progress: 0,
      message: 'Preparing download...'
    });

    try {
      await downloadVideoFile(videoResult, {
        format,
        quality,
        source: 'auto'
      }, (progress) => {
        setDownloadState({
          isDownloading: true,
          progress: progress.progress,
          message: progress.message
        });
      });

      setDownloadState({
        isDownloading: false,
        progress: 100,
        message: 'Download complete!'
      });

      // Clear message after 3 seconds
      setTimeout(() => {
        setDownloadState(prev => ({ ...prev, message: '' }));
      }, 3000);

    } catch (error) {
      setDownloadState({
        isDownloading: false,
        progress: 0,
        message: '',
        error: error instanceof Error ? error.message : 'Download failed'
      });
    }
  };

  const handleGenerateShareUrl = async () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      return;
    }

    try {
      const url = await createShareUrl(videoResult, 60); // 60 minutes expiration
      if (url) {
        setShareUrl(url);
        navigator.clipboard.writeText(url);
      }
    } catch (error) {
      console.error('Failed to generate share URL:', error);
    }
  };

  return (
    <Card className="glass-card overflow-hidden">
      {/* Video Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{videoResult.duration}s</Badge>
            <Badge variant="outline" className="text-xs">
              {videoResult.segments.length} Chapters
            </Badge>
            <Badge variant="outline" className="text-xs">
              {videoResult.format.toUpperCase()} • {videoResult.quality}
            </Badge>
          </div>
        </div>

        {/* S3 Upload Status */}
        {showS3Info && videoResult.s3Upload && (
          <div className="mt-3 p-3 glass-panel rounded-lg bg-success/5 border-success/20">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-success" />
              <div className="flex-1">
                <p className="text-sm font-medium text-success">Stored in AWS S3</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(videoResult.s3Upload.size)} •
                  Expires: {videoResult.s3Upload.expirationTime?.toLocaleString()}
                </p>
              </div>
              {videoResult.s3Upload.presignedUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(videoResult.s3Upload?.presignedUrl, '_blank')}
                  className="text-success hover:text-success"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Video Player */}
      <div
        className="relative bg-black aspect-video group cursor-pointer"
        onClick={togglePlay}
        onMouseMove={() => setShowControls(true)}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          playsInline
        />

        {/* Play/Pause Overlay */}
        <div className={`
          absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300
          ${isPlaying && showControls ? 'opacity-0' : 'opacity-100'}
        `}>
          <Button
            size="lg"
            variant="glass"
            className="rounded-full w-16 h-16"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </Button>
        </div>

        {/* Video Controls */}
        <div className={`
          absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300
          ${showControls ? 'opacity-100' : 'opacity-0'}
        `}>
          {/* Progress Bar */}
          <div className="mb-3">
            <Slider
              value={[videoResult.duration > 0 ? (currentTime / videoResult.duration) * 100 : 0]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            {/* Left Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  skipTime(-10);
                }}
                className="text-white hover:bg-white/20"
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  skipTime(10);
                }}
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-2 ml-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>

                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  className="w-20"
                />
              </div>

              <span className="text-white text-sm font-mono ml-2">
                {formatTime(currentTime)} / {formatTime(videoResult.duration)}
              </span>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  restart();
                }}
                className="text-white hover:bg-white/20"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="text-white hover:bg-white/20"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chapter Indicator */}
        {chapters[currentChapter] && (
          <div className="absolute top-4 left-4 bg-black/80 text-white px-3 py-1 rounded-full text-sm">
            {chapters[currentChapter].description}
          </div>
        )}
      </div>

      {/* Chapter Navigation */}
      <div className="p-4 border-b border-border/50">
        <h4 className="font-medium mb-3">Video Chapters</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {chapters.map((chapter, index) => (
            <Button
              key={chapter.id}
              variant={index === currentChapter ? "default" : "outline"}
              size="sm"
              onClick={() => skipToChapter(index)}
              className="justify-start text-xs"
            >
              <div className="text-left">
                <div className="font-medium">{chapter.description}</div>
                <div className="text-xs opacity-70">
                  {formatTime(chapter.startTime)}-{formatTime(chapter.endTime)}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Enhanced Action Buttons */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {showDownloadOptions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={downloadState.isDownloading}>
                    {downloadState.isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {Math.round(downloadState.progress)}%
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Download Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Current Format ({videoResult.format} • {videoResult.quality})
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleDownload('original', 'original')}>
                    <FileVideo className="w-4 h-4 mr-2" />
                    Original ({formatFileSize(videoResult.videoBlob.size)})
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Convert & Download
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => handleDownload('mp4', 'high')}>
                    MP4 High Quality
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload('mp4', 'medium')}>
                    MP4 Medium Quality
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload('webm', 'medium')}>
                    WebM Medium Quality
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateShareUrl}
              disabled={!videoResult.s3Upload}
            >
              <Share2 className="w-4 h-4 mr-2" />
              {shareUrl ? 'Copy Link' : 'Share'}
            </Button>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">AI Generated</Badge>
            <Badge variant="outline">Educational Content</Badge>
            {videoResult.s3Upload && (
              <Badge variant="outline" className="text-success border-success">
                <Cloud className="w-3 h-3 mr-1" />
                Cloud Stored
              </Badge>
            )}
          </div>
        </div>

        {/* Download Progress */}
        {downloadState.isDownloading && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>{downloadState.message}</span>
              <span>{Math.round(downloadState.progress)}%</span>
            </div>
            <Progress value={downloadState.progress} className="h-2" />
          </div>
        )}

        {/* Download Error */}
        {downloadState.error && (
          <div className="mb-4 p-3 glass-panel rounded-lg bg-destructive/5 border-destructive/20">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertTriangle className="w-4 h-4" />
              {downloadState.error}
            </div>
          </div>
        )}

        {/* Share URL Success */}
        {shareUrl && (
          <div className="mb-4 p-3 glass-panel rounded-lg bg-success/5 border-success/20">
            <div className="flex items-center gap-2 text-success text-sm">
              <CheckCircle className="w-4 h-4" />
              Share link copied to clipboard! (Expires in 1 hour)
            </div>
          </div>
        )}

        {/* Video Processing Info */}
        <div className="p-3 glass-panel rounded-lg bg-accent/5 border-accent/20">
          <div className="text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-accent">Generation Details</span>
              <Badge variant="secondary" className="text-xs">
                {Math.round(videoResult.processingTime / 1000)}s
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>Format: {videoResult.format.toUpperCase()}</div>
              <div>Quality: {videoResult.quality}</div>
              <div>Size: {formatFileSize(videoResult.videoBlob.size)}</div>
              <div>Segments: {videoResult.segments.length}</div>
            </div>
            {videoResult.s3Upload && (
              <div className="mt-2 text-xs text-muted-foreground">
                S3 Key: <code className="bg-muted px-1 rounded text-xs">
                  {videoResult.s3Upload.key.split('/').pop()}
                </code>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EnhancedVideoPlayer;