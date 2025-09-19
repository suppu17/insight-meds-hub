import { useState } from "react";
import { useNavigate } from "react-router-dom";
import MedInsightLogo from "@/components/MedInsightLogo";
import AnimatedHeroBackground from "@/components/AnimatedHeroBackground";
import UploadZone from "@/components/UploadZone";
import HealthAnalyzer from "@/components/HealthAnalyzer";
import ResultsDisplay from "@/components/ResultsDisplay";
import HistorySection from "@/components/HistorySection";
import SettingsDialog from "@/components/SettingsDialog";
import AuthDebug from "@/components/AuthDebug";
import { ArrowLeft, Menu } from "lucide-react";
import { ShimmerButton } from "@/components/shimmer-button";

interface HistoryEntry {
  id: string;
  medication: string;
  action: string;
  data: any;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'dashboard' | 'results' | 'history'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [isSymptomAnalyzerExpanded, setIsSymptomAnalyzerExpanded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [uploadedData, setUploadedData] = useState<{
    files?: File[];
    medication?: string;
    type: 'upload' | 'manual' | 'document';
    videoDuration?: string;
    videoStrategy?: string;
    extractedInfo?: any;
    timestamp?: number;
  } | null>(null);

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleFileUpload = (files: File[]) => {
    console.log('Files uploaded:', files);
    setUploadedData({ files, type: 'upload' });
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

    setUploadedData({
      medication: primaryMedication,
      type: 'document',
      extractedInfo,
      timestamp: Date.now()
    });

    setCurrentAction('overview');
    setCurrentView('results');
  };

  const handleAction = (action: string) => {
    if (!uploadedData) {
      console.log('Please enter medication first');
      return;
    }
    setCurrentAction(action);
    setCurrentView('results');
  };

  const handleBack = () => {
    setCurrentView('dashboard');
    setCurrentAction('');
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

  if (currentView === 'results') {
    return (
      <div className="min-h-screen relative">
        <AnimatedHeroBackground />
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
        <AnimatedHeroBackground />
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
the       <AnimatedHeroBackground />

      {/* Header Navigation */}
      <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-4 lg:px-12">
        <div className="flex items-center space-x-2 pl-3 sm:pl-6 lg:pl-12">
          <button
            onClick={handleBackToHome}
            className="mr-4 p-2 text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <MedInsightLogo />
        </div>

        <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
          {/* History button removed for redundancy */}
        </nav>

        <button className="md:hidden text-white p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu className="w-6 h-6" />
        </button>

        <ShimmerButton
          onClick={() => setIsSettingsOpen(true)}
          className="hidden md:flex bg-orange-500 hover:bg-orange-600 text-white px-4 lg:px-6 py-2 rounded-xl text-sm lg:text-base font-medium shadow-lg"
        >
          Settings
        </ShimmerButton>
      </header>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-black/95 backdrop-blur-sm border-b border-white/10 z-20">
          <nav className="flex flex-col space-y-4 px-6 py-6">
            <ShimmerButton
              onClick={() => setIsSettingsOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium shadow-lg w-fit"
            >
              Settings
            </ShimmerButton>
          </nav>
        </div>
      )}

      {/* Main Content - Centered Like Lovable */}
      <main className="relative z-10 flex flex-col items-center justify-start min-h-[calc(100vh-120px)] px-6 pt-10 sm:pt-12">
        <div className="w-full max-w-4xl mx-auto">
          {/* Simple Centered Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-3">
              Health Analysis Hub
            </h1>
            <p className="text-white text-lg">
              Analyze medications and symptoms with AI-powered insights
            </p>
          </div>

          {/* Main Input Container - Premium Style */}
          <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 mb-8 shadow-2xl hover:bg-white/8 transition-all duration-300">
            <UploadZone
              onFileUpload={handleFileUpload}
              onManualEntry={handleManualEntry}
              onAnalyze={handleAnalyzeAndVisualize}
              onDocumentAnalysis={handleDocumentAnalysis}
              onHistoryView={handleHistoryView}
              currentMedication={uploadedData?.medication}
            />
          </div>

          {/* Health Analysis - Premium Collapsible */}
          <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl hover:bg-white/8 transition-all duration-300">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 text-white">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <span className="font-semibold text-lg">Symptom & Concern Analyzer</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsSymptomAnalyzerExpanded(!isSymptomAnalyzerExpanded)}
                  className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/10 font-medium"
                >
                  {isSymptomAnalyzerExpanded ? 'Collapse' : 'Expand'}
                </button>
              </div>
              <p className="text-sm text-white/70 mt-3 leading-relaxed">
                Describe symptoms to get AI-powered health insights and natural remedy suggestions
              </p>
            </div>

            {/* Expandable Content */}
            {isSymptomAnalyzerExpanded ? (
              <div className="p-8 animate-in slide-in-from-top-4 duration-300">
                <HealthAnalyzer
                  onAnalysisComplete={(result) => {
                    console.log('Health analysis completed:', result);
                  }}
                />
              </div>
            ) : (
              <div className="p-6">
                <div className="text-center">
                  <p className="text-sm text-white/60 font-medium">Click Expand to access symptom analysis</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Settings Dialog */}
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
};

export default Dashboard;