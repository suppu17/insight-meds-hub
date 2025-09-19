import { useState } from "react";
import MedInsightLogo from "@/components/MedInsightLogo";
import UploadZone from "@/components/UploadZone";
import ResultsDisplay from "@/components/ResultsDisplay";
import HistorySection from "@/components/HistorySection";
import HealthAnalyzer from "@/components/HealthAnalyzer";
import GlassmorphismBackground from "@/components/GlassmorphismBackground";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Users, Globe, Clock, FileText, MessageSquare, History } from "lucide-react";
import heroImage from "@/assets/medical-hero-bg.jpg";
import { type HistoryEntry } from "@/lib/historyService";

const Index = () => {
  const [currentView, setCurrentView] = useState<'home' | 'results' | 'history'>('home');
  const [currentAction, setCurrentAction] = useState<string>('');
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [uploadedData, setUploadedData] = useState<{
    files?: File[];
    medication?: string;
    type: 'upload' | 'manual' | 'document';
    videoDuration?: string;
    videoStrategy?: string;
    extractedInfo?: any; // Medical info extracted from document
    timestamp?: number; // To ensure fresh data
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
    console.log('Document analysis - Fresh upload:', extractedInfo, 'Primary medication:', primaryMedication);
    
    // Clear any previous data and set fresh data
    setUploadedData({
      medication: primaryMedication,
      type: 'document',
      extractedInfo,
      // Add timestamp to ensure fresh data
      timestamp: Date.now()
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
    // Keep uploadedData so drug name persists in search bar
    // setUploadedData(null); // Commented out to maintain persistence
    setCurrentHistoryId(null);
  };

  const handleHistoryView = () => {
    setCurrentView('history');
  };

  const handleSelectHistoryEntry = (entry: HistoryEntry) => {
    setUploadedData({
      medication: entry.medication,
      type: entry.data.type || 'manual',
      videoDuration: entry.data.videoDuration,
      videoStrategy: entry.data.videoStrategy,
      extractedInfo: entry.data.extractedInfo
    });
    setCurrentAction(entry.action);
    setCurrentHistoryId(entry.id);
    setCurrentView('results');
  };

  const features = [
    {
      icon: FileText,
      title: "Drug Analyser",
      description: "Comprehensive drug analysis"
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
      <div className="min-h-screen relative">
        <GlassmorphismBackground />
        <div className="relative z-10 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <MedInsightLogo />
            </div>
            <ResultsDisplay
              action={currentAction}
              data={uploadedData}
              onBack={handleBack}
              historyEntryId={currentHistoryId}
            />
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'history') {
    return (
      <div className="min-h-screen relative">
        <GlassmorphismBackground />
        <div className="relative z-10 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <MedInsightLogo />
            </div>
            <HistorySection
              onSelectEntry={handleSelectHistoryEntry}
              onBack={handleBack}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Glassmorphism Background */}
      <GlassmorphismBackground />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="p-6">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <MedInsightLogo />
            <div className="flex items-center gap-3">
              {/* History button moved to UploadZone */}
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
                  Discover comprehensive drug education, visual guides, clinical research, and AI-powered symptom analysis—all in one place to support smarter health decisions and personalized care.
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
              <div className="text-center mb-8 mt-96">
                <h2 className="text-3xl font-bold mb-4">
                  <span className="bg-gradient-primary bg-clip-text text-transparent">
                    Explore Medicines: Education & Insights
                  </span>
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Learn about drugs, watch educational videos, view clinical research, and get a comprehensive overview by entering a drug name or uploading your prescription.
                </p>
              </div>
              <Card className="glass-card p-8">
                <UploadZone
                  onFileUpload={handleFileUpload}
                  onManualEntry={handleManualEntry}
                  onAnalyze={handleAnalyzeAndVisualize}
                  onDocumentAnalysis={handleDocumentAnalysis}
                  onHistoryView={handleHistoryView}
                  currentMedication={uploadedData?.medication}
                />
              </Card>
            </div>

            {/* Health Analysis Section */}
            <div className="mt-16">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4">
                    <span className="bg-gradient-primary bg-clip-text text-transparent">
                      Symptom & Concern Analyzer
                    </span>
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Get personalized health insights by describing your concerns and symptoms.
                    Our AI analyzes your input and provides evidence-based natural remedies and guidance.
                  </p>
                </div>

                <HealthAnalyzer
                  onAnalysisComplete={(result) => {
                    console.log('Health analysis completed:', result);
                  }}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;