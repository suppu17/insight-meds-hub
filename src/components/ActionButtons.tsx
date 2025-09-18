import { Eye, BarChart3, Search, Volume2, Microscope, TrendingUp } from "lucide-react";
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
      description: 'Key drug information',
      icon: Eye,
      gradient: 'bg-gradient-primary',
      delay: '0ms'
    },
    {
      id: 'visualize',
      title: 'Visualize',
      description: 'Mechanism of action',
      icon: BarChart3,
      gradient: 'bg-gradient-accent',
      delay: '100ms'
    },
    {
      id: 'research',
      title: 'Clinical Research',
      description: 'Latest studies & trials',
      icon: Search,
      gradient: 'bg-gradient-primary',
      delay: '200ms'
    },
    {
      id: 'deep_research',
      title: 'Deep Research',
      description: 'AI-powered market intelligence',
      icon: Microscope,
      gradient: 'bg-gradient-accent',
      delay: '250ms'
    },
    {
      id: 'competitive',
      title: 'Market Analysis',
      description: 'Competitive landscape & pricing',
      icon: TrendingUp,
      gradient: 'bg-gradient-primary',
      delay: '300ms'
    },
    {
      id: 'vocal',
      title: 'Voice Summary',
      description: 'Multi-language audio',
      icon: Volume2,
      gradient: 'bg-gradient-accent',
      delay: '350ms'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
  );
};

export default ActionButtons;