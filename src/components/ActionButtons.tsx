import { Eye, BarChart3, Search, Volume2, Stethoscope, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  onAction: (action: string) => void;
  isLoading?: boolean;
}

const ActionButtons = ({ onAction, isLoading = false }: ActionButtonsProps) => {
  const actions = [
    {
      id: 'overview',
      title: 'Overview',
      description: 'Key drug information & composition',
      icon: Eye,
      gradient: 'bg-gradient-primary',
      delay: '0ms'
    },
    {
      id: 'visualize',
      title: 'Visualize',
      description: 'Mechanism of action explained',
      icon: BarChart3,
      gradient: 'bg-gradient-accent',
      delay: '100ms'
    },
    {
      id: 'research',
      title: 'Latest Research',
      description: 'Current clinical studies & trials',
      icon: Search,
      gradient: 'bg-gradient-primary',
      delay: '200ms'
    },
    {
      id: 'vocal',
      title: 'Summarize Vocally',
      description: 'Multi-language voice summaries',
      icon: Volume2,
      gradient: 'bg-gradient-accent',
      delay: '300ms'
    }
  ];

  const additionalFeatures = [
    {
      id: 'symptoms',
      title: 'Check Symptoms',
      description: 'AI-powered symptom analysis',
      icon: Stethoscope,
      gradient: 'bg-gradient-primary',
      delay: '400ms'
    },
    {
      id: 'safety',
      title: 'Safety Analysis',
      description: 'Risk assessment & warnings',
      icon: AlertTriangle,
      gradient: 'bg-gradient-accent',
      delay: '500ms'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Primary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {actions.map((action) => {
          const IconComponent = action.icon;
          return (
            <Button
              key={action.id}
              onClick={() => onAction(action.id)}
              disabled={isLoading}
              variant="glass"
              className="group h-auto p-6 justify-start text-left"
              style={{ animationDelay: action.delay }}
            >
              <div className="flex items-start gap-4 w-full">
                <div className={`${action.gradient} rounded-xl p-3 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </div>
            </Button>
          );
        })}
      </div>

      {/* Additional Features */}
      <div className="space-y-4">
        <div className="text-center">
          <h4 className="text-lg font-semibold text-foreground mb-2">Additional Features</h4>
          <div className="w-24 h-0.5 bg-gradient-primary mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {additionalFeatures.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Button
                key={feature.id}
                onClick={() => onAction(feature.id)}
                disabled={isLoading}
                variant="outline"
                className="glass-button group h-auto p-4 justify-start text-left border-primary/20"
                style={{ animationDelay: feature.delay }}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className={`${feature.gradient} rounded-lg p-2 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors text-sm">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ActionButtons;