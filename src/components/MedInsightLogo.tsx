import { Activity, Heart } from "lucide-react";

const MedInsightLogo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="glass-panel rounded-full p-3 bg-gradient-primary">
          <Activity className="w-8 h-8 text-primary-foreground" />
        </div>
        <Heart className="w-4 h-4 text-accent absolute -top-1 -right-1 animate-pulse" />
      </div>
      <div>
        <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          MedInsight
        </h1>
        <p className="text-xs text-muted-foreground font-medium">
          AI-Powered Healthcare
        </p>
      </div>
    </div>
  );
};

export default MedInsightLogo;