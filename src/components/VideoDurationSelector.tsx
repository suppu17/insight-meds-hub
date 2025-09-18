import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Zap, PlayCircle, Settings2 } from 'lucide-react';

export type VideoDuration = '8s' | '16s' | '30s';
export type GenerationStrategy = 'parallel' | 'hybrid' | 'sequential';

export interface VideoDurationOption {
  duration: VideoDuration;
  label: string;
  description: string;
  segments: string;
  recommended?: boolean;
  strategy: GenerationStrategy;
  estimatedTime: string;
}

interface VideoDurationSelectorProps {
  selectedDuration: VideoDuration;
  onDurationChange: (duration: VideoDuration, strategy: GenerationStrategy) => void;
  className?: string;
}

const durationOptions: VideoDurationOption[] = [
  {
    duration: '8s',
    label: '8 Seconds',
    description: 'Quick overview with key points',
    segments: '4 × 2s segments',
    recommended: true,
    strategy: 'parallel',
    estimatedTime: '~2-3 min'
  },
  {
    duration: '16s',
    label: '16 Seconds',
    description: 'Balanced detail and speed',
    segments: '4 × 4s segments',
    strategy: 'hybrid',
    estimatedTime: '~4-5 min'
  },
  {
    duration: '30s',
    label: '30 Seconds',
    description: 'Comprehensive mechanism explanation',
    segments: '8s + 8s + 8s + 6s',
    strategy: 'sequential',
    estimatedTime: '~6-8 min'
  }
];

const strategyInfo = {
  parallel: {
    icon: Zap,
    label: 'Parallel Generation',
    description: 'All segments generated simultaneously',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  hybrid: {
    icon: Settings2,
    label: 'Hybrid Generation',
    description: 'Balanced speed and quality',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  sequential: {
    icon: PlayCircle,
    label: 'Sequential Generation',
    description: 'Traditional high-quality approach',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  }
};

const VideoDurationSelector = ({
  selectedDuration,
  onDurationChange,
  className = ''
}: VideoDurationSelectorProps) => {
  const handleDurationSelect = (option: VideoDurationOption) => {
    onDurationChange(option.duration, option.strategy);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4 text-primary" />
        <h4 className="font-medium text-foreground">Choose video duration:</h4>
      </div>

      <div className="flex gap-2">
        {durationOptions.map((option) => {
          const isSelected = selectedDuration === option.duration;
          return (
            <Button
              key={option.duration}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => handleDurationSelect(option)}
              className="flex-1"
            >
              {option.label}
              {option.recommended && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  ✨
                </Badge>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default VideoDurationSelector;