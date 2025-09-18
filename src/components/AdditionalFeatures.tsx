import { Stethoscope, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdditionalFeaturesProps {
  onAction: (action: string) => void;
  isLoading?: boolean;
}

const AdditionalFeatures = ({ onAction, isLoading = false }: AdditionalFeaturesProps) => {
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
  );
};

export default AdditionalFeatures;