import { useState } from "react";
import MedInsightLogo from "@/components/MedInsightLogo";
import UploadZone from "@/components/UploadZone";
import ActionButtons from "@/components/ActionButtons";
import ResultsDisplay from "@/components/ResultsDisplay";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Globe, Clock } from "lucide-react";
import heroImage from "@/assets/medical-hero-bg.jpg";

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'results'>('home');
  const [currentAction, setCurrentAction] = useState<string>('');
  const [uploadedData, setUploadedData] = useState<any>(null);

  const handleFileUpload = (files: File[]) => {
    console.log('Files uploaded:', files);
    setUploadedData({ files, type: 'upload' });
    // Here you would typically process the files
  };

  const handleManualEntry = (medication: string) => {
    console.log('Manual entry:', medication);
    setUploadedData({ medication, type: 'manual' });
  };

  const handleAction = (action: string) => {
    setCurrentAction(action);
    setCurrentView('results');
  };

  const handleBack = () => {
    setCurrentView('home');
    setCurrentAction('');
  };

  const features = [
    {
      icon: Shield,
      title: "HIPAA Compliant",
      description: "Your data is secure and private"
    },
    {
      icon: Globe,
      title: "Multi-Language",
      description: "Support for 20+ languages"
    },
    {
      icon: Users,
      title: "AI-Powered",
      description: "Advanced medical AI analysis"
    },
    {
      icon: Clock,
      title: "Real-Time",
      description: "Instant medication insights"
    }
  ];

  if (currentView === 'results') {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <MedInsightLogo />
          </div>
          <ResultsDisplay
            action={currentAction}
            data={uploadedData}
            onBack={handleBack}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 opacity-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-hero opacity-90" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="p-6">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <MedInsightLogo />
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="glass-panel">
                <Shield className="w-3 h-3 mr-1" />
                Secure
              </Badge>
              <Badge variant="secondary" className="glass-panel">
                No Login Required
              </Badge>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="px-6 pb-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-primary bg-clip-text text-transparent">
                    Empower Your Health
                  </span>
                  <br />
                  <span className="text-foreground">
                    with AI-Driven Insights
                  </span>
                </h1>
                
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Upload your prescription, medication photo, or enter drug names manually 
                  to get comprehensive medical information, safety analysis, and personalized guidance.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                {features.map((feature, i) => {
                  const IconComponent = feature.icon;
                  return (
                    <div key={i} className="glass-panel rounded-full px-4 py-2 flex items-center gap-2">
                      <IconComponent className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{feature.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Upload Section */}
              <div className="space-y-8">
                <Card className="glass-card p-8">
                  
                  <UploadZone
                    onFileUpload={handleFileUpload}
                    onManualEntry={handleManualEntry}
                  />
                </Card>

              </div>

              {/* Actions Section */}
              <div className="space-y-8">
                <Card className="glass-card p-8">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold mb-2">
                      Available Actions
                    </h2>
                    <p className="text-muted-foreground">
                      Comprehensive medication analysis tools
                    </p>
                  </div>
                  
                  <ActionButtons
                    onAction={handleAction}
                    isLoading={false}
                  />
                </Card>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 text-center">
              <div className="glass-card p-8 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-primary">10K+</div>
                    <div className="text-sm text-muted-foreground">Medications Analyzed</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-accent">99.9%</div>
                    <div className="text-sm text-muted-foreground">Accuracy Rate</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-primary">24/7</div>
                    <div className="text-sm text-muted-foreground">Available</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;