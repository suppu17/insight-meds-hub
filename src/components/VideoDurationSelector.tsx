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
  const [showDetails, setShowDetails] = useState(false);

  const handleDurationSelect = (option: VideoDurationOption) => {
    onDurationChange(option.duration, option.strategy);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Video Duration</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="text-muted-foreground hover:text-foreground"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
      </div>

      {/* Duration Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {durationOptions.map((option) => {
          const isSelected = selectedDuration === option.duration;
          const StrategyIcon = strategyInfo[option.strategy].icon;

          return (
            <Card
              key={option.duration}
              className={`relative cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected
                  ? 'ring-2 ring-primary bg-primary/5 border-primary'
                  : 'border-border hover:border-primary/30'
              }`}
              onClick={() => handleDurationSelect(option)}
            >
              <div className="p-4 space-y-3">
                {/* Header with badges */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-foreground">
                        {option.label}
                      </h4>
                      {option.recommended && (
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>

                {/* Segment info */}
                <div className="flex items-center gap-2 text-sm">
                  <PlayCircle className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{option.segments}</span>
                </div>

                {/* Strategy info */}
                <div className={`flex items-center gap-2 p-2 rounded-md ${strategyInfo[option.strategy].bgColor}`}>
                  <StrategyIcon className={`w-4 h-4 ${strategyInfo[option.strategy].color}`} />
                  <div className="flex-1">
                    <div className={`text-xs font-medium ${strategyInfo[option.strategy].color}`}>
                      {strategyInfo[option.strategy].label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Est: {option.estimatedTime}
                    </div>
                  </div>
                </div>

                {/* Details (if expanded) */}
                {showDetails && (
                  <div className="pt-2 border-t border-border/50">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>• {strategyInfo[option.strategy].description}</div>
                      <div>• Generates {option.segments.split('×')[0]} segments</div>
                      {option.strategy === 'parallel' && (
                        <div>• ⚡ Fastest generation (all at once)</div>
                      )}
                      {option.strategy === 'hybrid' && (
                        <div>• ⚖️ Balanced speed and quality</div>
                      )}
                      {option.strategy === 'sequential' && (
                        <div>• 🎯 Best visual continuity</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Selected option summary */}
      <div className="p-3 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="flex-1 text-sm">
            <span className="font-medium text-foreground">Selected: </span>
            <span className="text-muted-foreground">
              {durationOptions.find(opt => opt.duration === selectedDuration)?.label} video with{' '}
              {durationOptions.find(opt => opt.duration === selectedDuration)?.strategy} generation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDurationSelector;