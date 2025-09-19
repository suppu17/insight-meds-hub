import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
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
  SkipForward
} from "lucide-react";
import type { VideoSegment } from "@/lib/api/fal";

interface VideoPlayerProps {
  videoBlob: Blob;
  segments: VideoSegment[];
  duration: number;
  title?: string;
  description?: string;
  onDownload?: () => void;
  onShare?: () => void;
}

interface VideoChapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  description: string;
}

const VideoPlayer = ({
  videoBlob,
  segments,
  duration,
  title = "Drug Mechanism Explanation",
  description = "AI-generated educational video",
  onDownload,
  onShare
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [currentChapter, setCurrentChapter] = useState(0);
  const [showControls, setShowControls] = useState(true);

  // Create chapters based on segments
  const chapters: VideoChapter[] = segments.map((segment, index) => {
    const startTime = segments.slice(0, index).reduce((sum, s) => sum + s.duration, 0);
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
    const url = URL.createObjectURL(videoBlob);
    setVideoUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [videoBlob]);

  // Update current time and chapter
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);

      // Update current chapter
      const newChapter = chapters.findIndex(
        (chapter) => video.currentTime >= chapter.startTime && video.currentTime < chapter.endTime
      );
      if (newChapter !== -1 && newChapter !== currentChapter) {
        setCurrentChapter(newChapter);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

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
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const showControlsTemp = () => {
      setShowControls(true);
      clearTimeout(timeout);
      hideControls();
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

    const newTime = (value[0] / 100) * duration;
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

    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
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
            <Badge variant="secondary">30s</Badge>
            <Badge variant="outline" className="text-xs">
              4 Chapters
            </Badge>
          </div>
        </div>
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
              value={[duration > 0 ? (currentTime / duration) * 100 : 0]}
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
                {formatTime(currentTime)} / {formatTime(duration)}
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

      {/* Action Buttons */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload} className="rounded-xl shadow-lg">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
          {onShare && (
            <Button variant="outline" size="sm" onClick={onShare} className="rounded-xl shadow-lg">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">AI Generated</Badge>
          <Badge variant="outline">Educational Content</Badge>
        </div>
      </div>
    </Card>
  );
};

export default VideoPlayer;