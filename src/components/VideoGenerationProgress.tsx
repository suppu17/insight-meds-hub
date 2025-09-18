import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Video,
  Image,
  Link,
  CheckCircle,
  Loader2,
  Clock,
  Sparkles
} from "lucide-react";

export interface VideoGenerationStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  progress?: number;
  message?: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface VideoGenerationProgressProps {
  currentStage: number;
  stages: VideoGenerationStage[];
  overallProgress: number;
  currentMessage: string;
  estimatedTimeRemaining?: number;
  onCancel?: () => void;
}

const VideoGenerationProgress = ({
  currentStage,
  stages,
  overallProgress,
  currentMessage,
  estimatedTimeRemaining,
  onCancel
}: VideoGenerationProgressProps) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  // Animate progress changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(overallProgress);
    }, 100);
    return () => clearTimeout(timer);
  }, [overallProgress]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${remainingSeconds}s`;
  };

  const getStageColor = (status: VideoGenerationStage['status']) => {
    switch (status) {
      case 'completed':
        return 'text-success';
      case 'in_progress':
        return 'text-primary';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStageIcon = (stage: VideoGenerationStage) => {
    const IconComponent = stage.icon;

    if (stage.status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-success" />;
    } else if (stage.status === 'in_progress') {
      return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    } else {
      return <IconComponent className={`w-5 h-5 ${getStageColor(stage.status)}`} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="glass-panel rounded-full p-3 animate-pulse">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Generating Educational Video</h3>
              <p className="text-sm text-muted-foreground">
                Creating 30-second AI-powered drug mechanism explanation
              </p>
            </div>
          </div>

          {estimatedTimeRemaining && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>~{formatTime(estimatedTimeRemaining)}</span>
            </div>
          )}
        </div>

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm font-mono">{Math.round(animatedProgress)}%</span>
          </div>
          <Progress
            value={animatedProgress}
            className="h-2"
          />
        </div>

        {/* Current Message */}
        <div className="mt-4 p-3 glass-panel rounded-lg">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-sm font-medium">{currentMessage}</span>
          </div>
        </div>
      </Card>

      {/* Stage Progress */}
      <Card className="glass-card p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          Generation Stages
        </h4>

        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div
              key={stage.id}
              className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-300 ${
                stage.status === 'in_progress'
                  ? 'glass-panel border border-primary/20'
                  : stage.status === 'completed'
                  ? 'glass-panel border border-success/20'
                  : 'opacity-60'
              }`}
            >
              {/* Stage Icon */}
              <div className="flex-shrink-0">
                {getStageIcon(stage)}
              </div>

              {/* Stage Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h5 className={`font-medium ${getStageColor(stage.status)}`}>
                    {stage.name}
                  </h5>
                  <Badge
                    variant={
                      stage.status === 'completed' ? 'default' :
                      stage.status === 'in_progress' ? 'secondary' :
                      stage.status === 'error' ? 'destructive' :
                      'outline'
                    }
                    className="text-xs"
                  >
                    {stage.status === 'in_progress' ? 'Active' :
                     stage.status === 'completed' ? 'Done' :
                     stage.status === 'error' ? 'Failed' : 'Pending'}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground">
                  {stage.message || stage.description}
                </p>

                {/* Individual Stage Progress */}
                {stage.status === 'in_progress' && stage.progress !== undefined && (
                  <div className="mt-2">
                    <Progress
                      value={stage.progress}
                      className="h-1"
                    />
                  </div>
                )}
              </div>

              {/* Stage Number */}
              <div className="flex-shrink-0">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  ${stage.status === 'completed'
                    ? 'bg-success text-success-foreground' :
                    stage.status === 'in_progress'
                    ? 'bg-primary text-primary-foreground' :
                    stage.status === 'error'
                    ? 'bg-destructive text-destructive-foreground' :
                    'bg-muted text-muted-foreground'
                  }
                `}>
                  {index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Video Segments Preview */}
      <Card className="glass-card p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Link className="w-5 h-5 text-accent" />
          Video Segments (30 seconds total)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: "Introduction", duration: "0-8s", description: "Drug overview and basics" },
            { title: "Mechanism", duration: "8-16s", description: "Cellular action details" },
            { title: "Effects", duration: "16-24s", description: "Therapeutic benefits" },
            { title: "Safety", duration: "24-30s", description: "Warnings and summary" }
          ].map((segment, index) => (
            <div
              key={segment.title}
              className={`p-3 rounded-lg border transition-all duration-300 ${
                index < currentStage
                  ? 'border-success bg-success/5' :
                  index === currentStage
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-muted/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium">{segment.title}</h5>
                <Badge variant="outline" className="text-xs">
                  {segment.duration}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {segment.description}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Cancel Button */}
      {onCancel && (
        <div className="text-center">
          <button
            onClick={onCancel}
            className="text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            Cancel Generation
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoGenerationProgress;