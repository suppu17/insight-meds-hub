import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  CheckCircle,
  Clock,
  Video,
  AlertTriangle
} from "lucide-react";
import type { VideoSegment } from "@/lib/api/fal";

interface SegmentPreviewProps {
  segment: VideoSegment;
  isCompleted: boolean;
  isGenerating?: boolean;
  hasError?: boolean;
  onPlay?: (segmentNumber: number) => void;
  onRetry?: (segmentNumber: number) => void;
  className?: string;
}

const SegmentPreview = ({
  segment,
  isCompleted,
  isGenerating = false,
  hasError = false,
  onPlay,
  onRetry,
  className = ""
}: SegmentPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [internalError, setInternalError] = useState(false);

  // Generate segment titles and descriptions
  const getSegmentInfo = (segmentNumber: number) => {
    const segments = [
      {
        title: "Introduction",
        description: "Drug overview and basics",
        timeRange: "0-8s"
      },
      {
        title: "Mechanism",
        description: "How the drug works",
        timeRange: "8-16s"
      },
      {
        title: "Effects",
        description: "Therapeutic benefits",
        timeRange: "16-24s"
      },
      {
        title: "Safety",
        description: "Warnings and summary",
        timeRange: "24-30s"
      }
    ];

    return segments[segmentNumber - 1] || {
      title: `Segment ${segmentNumber}`,
      description: "Video segment",
      timeRange: `${(segmentNumber - 1) * 8}-${segmentNumber * 8}s`
    };
  };

  const segmentInfo = getSegmentInfo(segment.segmentNumber);

  // Initialize video URL when segment is completed
  useEffect(() => {
    if (isCompleted && segment.videoUrl) {
      // Check if it's a real URL or placeholder
      if (segment.videoUrl.startsWith('http')) {
        setVideoUrl(segment.videoUrl);
      } else if (segment.videoUrl === "") {
        // Empty URL indicates failed segment
        setInternalError(true);
      }
    }
  }, [isCompleted, segment.videoUrl]);

  // Detect failed segments
  const isFailedSegment = isCompleted && (!segment.videoUrl || segment.videoUrl === "");
  const actualHasError = hasError || isFailedSegment || internalError;

  // Update current time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = () => {
      setInternalError(true);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [videoUrl]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isPlaying) {
        video.pause();
      } else {
        await video.play();
        onPlay?.(segment.segmentNumber);
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error playing video:', error);
      setInternalError(true);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    if (isGenerating) {
      return (
        <Badge variant="secondary" className="animate-pulse">
          <Clock className="w-3 h-3 mr-1" />
          Generating...
        </Badge>
      );
    }
    if (actualHasError) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    }
    if (isCompleted) {
      return (
        <Badge variant="default" className="bg-success text-success-foreground">
          <CheckCircle className="w-3 h-3 mr-1" />
          Ready
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  return (
    <Card className={`glass-card transition-all duration-300 ${className} ${
      actualHasError ? 'border-destructive/30 bg-destructive/5' :
      isCompleted ? 'border-success/30 bg-success/5' :
      isGenerating ? 'border-primary/30 bg-primary/5' :
      'opacity-60'
    }`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-semibold text-sm">{segmentInfo.title}</h4>
            <p className="text-xs text-muted-foreground">{segmentInfo.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {segmentInfo.timeRange}
            </Badge>
            {getStatusBadge()}
          </div>
        </div>

        {/* Video Preview */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-3">
          {isCompleted && videoUrl && !actualHasError ? (
            <>
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                playsInline
                muted={isMuted}
              />

              {/* Play Overlay */}
              <div className={`
                absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity
                ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}
              `}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={togglePlay}
                  className="rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </Button>
              </div>

              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={togglePlay}
                      className="h-6 w-6 p-0 text-white hover:bg-white/20"
                    >
                      {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={toggleMute}
                      className="h-6 w-6 p-0 text-white hover:bg-white/20"
                    >
                      {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </Button>
                  </div>

                  <span className="text-xs font-mono">
                    {formatTime(currentTime)} / {formatTime(segment.duration)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            // Placeholder for generating/pending states
            <div className="w-full h-full flex items-center justify-center">
              {isGenerating ? (
                <div className="text-center text-white">
                  <Video className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm">Generating...</p>
                </div>
              ) : actualHasError ? (
                <div className="text-center text-red-400">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm mb-2">Generation Failed</p>
                  {onRetry && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRetry(segment.segmentNumber)}
                      className="text-xs"
                    >
                      Retry
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <Video className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Waiting...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Segment Info */}
        <div className="text-xs text-muted-foreground">
          <div className="flex justify-between items-center">
            <span>Segment {segment.segmentNumber} of 4</span>
            <span>{segment.duration}s duration</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SegmentPreview;