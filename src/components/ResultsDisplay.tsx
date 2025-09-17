import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, AlertTriangle, Clock, CheckCircle, ExternalLink } from "lucide-react";

interface ResultsDisplayProps {
  action: string;
  data: any;
  onBack: () => void;
}

const ResultsDisplay = ({ action, data, onBack }: ResultsDisplayProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call delay
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [action]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="glass-panel rounded-full p-6 w-fit mx-auto animate-pulse">
              <div className="w-12 h-12 bg-primary/20 rounded-full"></div>
            </div>
            <h3 className="text-xl font-semibold">Analyzing Your Medication...</h3>
            <p className="text-muted-foreground">
              Our AI is processing your request and gathering the latest medical information.
            </p>
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6 animate-pulse">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded-lg w-3/4"></div>
                  <div className="h-3 bg-muted rounded-lg w-1/2"></div>
                  <div className="h-3 bg-muted rounded-lg w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Sample data for demonstration
    const sampleData = {
      overview: {
        title: "Medication Overview",
        medication: data?.medication || "Sample Medication",
        composition: ["Active Ingredient 1", "Active Ingredient 2", "Excipients"],
        uses: ["Pain relief", "Anti-inflammatory", "Fever reduction"],
        sideEffects: ["Nausea", "Dizziness", "Headache"],
        warnings: ["Do not exceed recommended dose", "Consult doctor if pregnant"]
      },
      visualize: {
        title: "Mechanism of Action",
        description: "This medication works by inhibiting specific enzymes in the body...",
        steps: ["Absorption", "Distribution", "Metabolism", "Excretion"]
      },
      research: {
        title: "Latest Clinical Research",
        studies: [
          { title: "Recent Study on Efficacy", date: "2024", journal: "Medical Journal" },
          { title: "Safety Analysis", date: "2024", journal: "Clinical Review" }
        ]
      },
      vocal: {
        title: "Voice Summary",
        languages: ["English", "Spanish", "French", "German"],
        transcript: "This medication is used for pain relief and inflammation..."
      }
    };

    const content = sampleData[action as keyof typeof sampleData];

    switch (action) {
      case 'overview':
        const overviewContent = sampleData.overview;
        return (
          <div className="space-y-6">
            <Card className="glass-card p-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                {overviewContent.medication}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-primary mb-2">Composition</h4>
                    <div className="space-y-1">
                      {overviewContent.composition.map((item, i) => (
                        <Badge key={i} variant="secondary" className="mr-1">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-success mb-2">Primary Uses</h4>
                    <ul className="space-y-1">
                      {overviewContent.uses.map((use, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-success" />
                          {use}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-warning mb-2">Side Effects</h4>
                    <ul className="space-y-1">
                      {overviewContent.sideEffects.map((effect, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-warning" />
                          {effect}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-destructive mb-2">Important Warnings</h4>
                    <ul className="space-y-1">
                      {overviewContent.warnings.map((warning, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );
        
      case 'research':
        const researchContent = sampleData.research;
        return (
          <div className="space-y-6">
            <Card className="glass-card p-6">
              <h3 className="text-2xl font-bold mb-4">Latest Clinical Research</h3>
              <div className="space-y-4">
                {researchContent.studies.map((study, i) => (
                  <div key={i} className="glass-panel p-4 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{study.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {study.journal} • {study.date}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );
        
      default:
        return (
          <Card className="glass-card p-6">
            <h3 className="text-2xl font-bold mb-4 capitalize">{action} Results</h3>
            <p className="text-muted-foreground">
              This feature is being developed. Advanced AI analysis will be available soon.
            </p>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          onClick={onBack}
          variant="glass"
          size="sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold capitalize">{action}</h2>
          <p className="text-sm text-muted-foreground">
            AI-powered medication analysis
          </p>
        </div>
      </div>
      
      {renderContent()}
      
      <div className="glass-card p-4 border-accent/20">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-accent mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-accent">Medical Disclaimer</p>
            <p className="text-muted-foreground">
              This information is for educational purposes only and does not replace professional medical advice. 
              Always consult your healthcare provider before making medication decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;