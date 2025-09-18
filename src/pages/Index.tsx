import { useState } from "react";
import MedInsightLogo from "@/components/MedInsightLogo";
import UploadZone from "@/components/UploadZone";
import ResultsDisplay from "@/components/ResultsDisplay";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Globe, Clock, FileText, MessageSquare } from "lucide-react";
import heroImage from "@/assets/medical-hero-bg.jpg";

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'results'>('home');
  const [currentAction, setCurrentAction] = useState<string>('');
  const [uploadedData, setUploadedData] = useState<{
    files?: File[];
    medication?: string;
    type: 'upload' | 'manual' | 'document';
    videoDuration?: string;
    videoStrategy?: string;
    extractedInfo?: any; // Medical info extracted from document
  } | null>(null);

  const handleFileUpload = (files: File[]) => {
    console.log('Files uploaded:', files);
    setUploadedData({ files, type: 'upload' });
    // Here you would typically process the files
  };

  const handleManualEntry = (medication: string) => {
    console.log('Manual entry:', medication);
    setUploadedData({ medication, type: 'manual' });
  };

  const handleAnalyzeAndVisualize = (medication: string, action: string, videoDuration?: string, videoStrategy?: string) => {
    console.log('Analyzing:', medication, 'with action:', action, 'duration:', videoDuration, 'strategy:', videoStrategy);
    setUploadedData({
      medication,
      type: 'manual',
      videoDuration,
      videoStrategy
    });
    setCurrentAction(action);
    setCurrentView('results');
  };

  const handleDocumentAnalysis = (extractedInfo: any, primaryMedication: string) => {
    console.log('Document analysis:', extractedInfo, 'Primary medication:', primaryMedication);
    setUploadedData({
      medication: primaryMedication,
      type: 'document',
      extractedInfo
    });
    // Auto-navigate to results with overview action
    setCurrentAction('overview');
    setCurrentView('results');
  };

  const handleAction = (action: string) => {
    if (!uploadedData) {
      // If no data uploaded yet, stay on home and show message
      console.log('Please enter medication first');
      return;
    }
    setCurrentAction(action);
    setCurrentView('results');
  };

  const handleBack = () => {
    setCurrentView('home');
    setCurrentAction('');
    setUploadedData(null);
  };

  const features = [
    {
      icon: FileText,
      title: "Visit Summary",
      description: "Comprehensive visit analysis"
    },
    {
      icon: Shield,
      title: "Symptom Checker",
      description: "AI-powered symptom analysis"
    },
    {
      icon: Clock,
      title: "Real-Time",
      description: "Instant medication insights"
    },
    {
      icon: MessageSquare,
      title: "Voice AI ChatBot",
      description: "Interactive medical assistant"
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

            {/* Main Content - Single Column */}
            <div className="max-w-4xl mx-auto">
              <Card className="glass-card p-8">
                <UploadZone
                  onFileUpload={handleFileUpload}
                  onManualEntry={handleManualEntry}
                  onAnalyze={handleAnalyzeAndVisualize}
                  onDocumentAnalysis={handleDocumentAnalysis}
                />
              </Card>
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