import { useState, useCallback, useEffect } from "react";
import { Upload, FileText, Pill, ArrowRight, Eye, BarChart3, Search, Volume2, Loader2, Image, Video, Microscope, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import VideoDurationSelector, { VideoDuration, GenerationStrategy } from "@/components/VideoDurationSelector";
import NotificationPopup, { NotificationType } from "@/components/ui/notification-popup";
import { isDrugName, getDrugValidationMessage, getSuggestedDrugNames } from "@/lib/utils/drugValidation";
import { processDocument, hasValidMedications, getPrimaryMedication, formatMedicalInfoForAnalysis } from "@/lib/utils/documentProcessor";

interface ExtractedMedicalInfo {
  medications: string[];
  symptoms: string[];
  clinicalNotes: string[];
  dosageRegimen: string[];
  rxIndications: string[];
  patientInfo?: {
    name?: string;
    age?: string;
    dob?: string;
  };
  prescriber?: {
    name?: string;
    npi?: string;
    clinic?: string;
  };
  rawText: string;
}

interface UploadZoneProps {
  onFileUpload: (files: File[]) => void;
  onManualEntry: (medication: string) => void;
  onAnalyze?: (medication: string, action: string, videoDuration?: VideoDuration, videoStrategy?: GenerationStrategy) => void;
  onDocumentAnalysis?: (extractedInfo: ExtractedMedicalInfo, primaryMedication: string) => void;
  onHistoryView?: () => void;
  currentMedication?: string; // Add this to show persistent medication
}

const UploadZone = ({ onFileUpload, onManualEntry, onAnalyze, onDocumentAnalysis, onHistoryView, currentMedication }: UploadZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [manualInput, setManualInput] = useState(currentMedication || "");
  const [videoDuration, setVideoDuration] = useState<VideoDuration>('8s');
  const [videoStrategy, setVideoStrategy] = useState<GenerationStrategy>('parallel');
  const [showVideoOptions, setShowVideoOptions] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: NotificationType;
    title: string;
    message: string;
    suggestions?: string[];
  }>({ isOpen: false, type: 'error', title: '', message: '' });

  // Document processing state
  const [isProcessingDocument, setIsProcessingDocument] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  // Update input when currentMedication changes
  useEffect(() => {
    if (currentMedication && currentMedication !== manualInput) {
      setManualInput(currentMedication);
    }
  }, [currentMedication]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleDocumentUpload(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await handleDocumentUpload(files[0]);
      // Reset the input so the same file can be selected again
      e.target.value = '';
    }
  }, []);

  const handleDurationChange = (duration: VideoDuration, strategy: GenerationStrategy) => {
    setVideoDuration(duration);
    setVideoStrategy(strategy);
  };

  const showNotification = (type: NotificationType, title: string, message: string, suggestions?: string[]) => {
    setNotification({ isOpen: true, type, title, message, suggestions });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  const handleDocumentUpload = async (file: File) => {
    try {
      setIsProcessingDocument(true);
      setProcessingMessage('Processing document...');

      // Clear any previous data to prevent caching issues
      console.log('Starting fresh document upload for file:', file.name);

      // Validate file type - be more flexible with image formats
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';
      
      if (!isImage && !isPDF) {
        throw new Error('Please upload an image (JPG, PNG, GIF, WEBP, etc.) or PDF file.');
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB.');
      }

      setProcessingMessage('Extracting text from document with OCR...');

      // Process the document with timestamp to ensure fresh processing
      console.log('Processing document at:', new Date().toISOString());
      const extractedInfo = await processDocument(file);

      console.log('Extracted info:', extractedInfo);
      console.log('Found medications:', extractedInfo.medications);

      setProcessingMessage('Analyzing medical information...');

      // Check if we found any valid medications
      if (!hasValidMedications(extractedInfo)) {
        showNotification(
          'warning',
          'No Medications Found',
          'The uploaded document does not contain any recognizable medication names. Please ensure the document is a prescription, medical report, or contains medication information.',
        );
        return;
      }

      // Get the primary medication for analysis
      const primaryMedication = getPrimaryMedication(extractedInfo);

      console.log('Primary medication identified:', primaryMedication);

      if (!primaryMedication) {
        showNotification(
          'error',
          'Missing Drug Name',
          'No valid drug name found in the uploaded document. Please ensure the document contains medication names.',
        );
        return;
      }

      // Success - show what we found
      const medicationList = extractedInfo.medications.join(', ');
      showNotification(
        'success',
        'Document Processed Successfully',
        `Found medications: ${medicationList}. Starting analysis for ${primaryMedication}.`,
      );

      // Clear any previous input to ensure fresh data
      setManualInput('');

      // Trigger analysis with the primary medication
      onManualEntry(primaryMedication);

      // If document analysis callback is provided, call it
      if (onDocumentAnalysis) {
        onDocumentAnalysis(extractedInfo, primaryMedication);
      }

      // Auto-start overview analysis after a short delay
      setTimeout(() => {
        if (onAnalyze) {
          console.log('Starting analysis for:', primaryMedication);
          onAnalyze(primaryMedication, 'overview');
        }
        closeNotification();
      }, 3000);

    } catch (error) {
      console.error('Document upload failed:', error);
      showNotification(
        'error',
        'Document Processing Failed',
        error instanceof Error ? error.message : 'Failed to process the uploaded document. Please try again.',
      );
    } finally {
      setIsProcessingDocument(false);
      setProcessingMessage('');
    }
  };

  const handleManualSubmit = () => {
    const input = manualInput.trim();

    if (!input) {
      showNotification('error', 'Missing Input', 'Please enter a medication name to continue.');
      return;
    }

    if (!isDrugName(input)) {
      const message = getDrugValidationMessage(input);
      const suggestions = getSuggestedDrugNames(input);

      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Invalid Medication Name',
        message,
        suggestions
      });
      return;
    }

    // Valid drug name - trigger overview analysis
    onManualEntry(input);
    if (onAnalyze) {
      onAnalyze(input, 'overview');
    }
    setManualInput("");
  };

  const handleAnalysisSelect = (action: string) => {
    const input = manualInput.trim();

    if (!input) {
      showNotification('error', 'Missing Input', 'Please enter a medication name to continue.');
      return;
    }

    // Validate that the input is a drug name
    if (!isDrugName(input)) {
      const message = getDrugValidationMessage(input);
      const suggestions = getSuggestedDrugNames(input);

      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Invalid Medication Name',
        message,
        suggestions
      });
      return;
    }

    // Valid drug name - proceed with analysis
    onManualEntry(input);

    if (onAnalyze) {
      if (action === 'visualize') {
        onAnalyze(input, action, videoDuration, videoStrategy);
      } else {
        onAnalyze(input, action);
      }
    }

    setManualInput("");
  };

  const analysisOptions = [
    {
      id: 'overview',
      title: 'Overview',
      description: '',
      icon: Eye,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'picturize',
      title: 'Picturize',
      description: '',
      icon: Image,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      id: 'visualize',
      title: 'Visualize',
      description: '',
      icon: Video,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'research',
      title: 'Clinical Research',
      description: '',
      icon: Microscope,
      gradient: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div className="flex justify-between items-start">
        <div className="text-center flex-1 space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">What do you want to analyze?</h2>
            <p className="text-muted-foreground">Upload medication info or enter drug name to get started</p>
          </div>
        </div>
        {onHistoryView && (
          <Button
            onClick={onHistoryView}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 ml-4"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </Button>
        )}
      </div>

      {/* Main Input Area - v0 Inspired */}
      <div className="glass-card p-8 border-2 border-primary/20">
        <div className="space-y-6">
          <div className="relative">
            <Input
              placeholder="Enter medication name (e.g., Aspirin, Metformin, Lisinopril)..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
              className="text-lg py-4 px-6 pr-16 border-2 border-primary/30 rounded-xl focus:border-primary transition-all bg-background/50"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              {manualInput.trim() ? "Choose analysis below" : "Enter drug name"}
            </div>
          </div>

          {/* Analysis Options */}
          {manualInput.trim() && (
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Choose your analysis type for <span className="font-medium text-foreground">{manualInput}</span></p>
              </div>

              {/* Video Duration Selector - Only show when Visualize is selected */}
              <div
                className={`transition-all duration-300 ${
                  showVideoOptions ? 'opacity-100 max-h-96 mb-4' : 'opacity-0 max-h-0 overflow-hidden'
                }`}
              >
                <div className="glass-panel p-4 rounded-xl">
                  <VideoDurationSelector
                    selectedDuration={videoDuration}
                    onDurationChange={handleDurationChange}
                  />
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => handleAnalysisSelect('visualize')}
                      className="flex-1"
                    >
                      Generate Video
                    </Button>
                    <Button
                      onClick={() => setShowVideoOptions(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {analysisOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <Button
                      key={option.id}
                      onClick={() => {
                        if (option.id === 'visualize') {
                          if (!showVideoOptions) {
                            // Show video options for selection
                            setShowVideoOptions(true);
                          }
                        } else {
                          setShowVideoOptions(false); // Hide video options when other tiles are selected
                          handleAnalysisSelect(option.id);
                        }
                      }}
                      variant="outline"
                      className={`h-auto p-4 flex flex-col gap-2 hover:bg-primary/5 border border-primary/20 group transition-all ${
                        option.id === 'visualize' && showVideoOptions ? 'ring-2 ring-primary/50 bg-primary/5' : ''
                      }`}
                    >
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${option.gradient} group-hover:scale-110 transition-transform`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-sm">
                          {option.title}
                          {option.id === 'visualize' && showVideoOptions && (
                            <span className="text-xs block text-primary font-normal">Configure below ↓</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alternative Options */}
      <div className="space-y-3">
        <div className="text-center text-sm text-muted-foreground">
          Or choose
        </div>

        <div className="flex justify-center">
          {/* Upload Files Option */}
          <button
            className={cn(
              "w-full glass-card p-4 rounded-xl cursor-pointer hover:bg-primary/5 transition-colors group border border-transparent hover:border-primary/20 disabled:opacity-50 disabled:cursor-not-allowed",
              isDragOver && "bg-primary/10 border-primary/30"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={isProcessingDocument}
          >
            <input
              id="file-upload"
              type="file"
              accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  {isProcessingDocument ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <FileText className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="text-left">
                  <div className="font-medium">
                    {isProcessingDocument ? 'Processing...' : 'Upload File'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isProcessingDocument ? processingMessage : 'Prescription PDF or medical report'}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </button>
        </div>
      </div>

      {/* Bottom Helper Text */}
      <div className="text-center text-xs text-muted-foreground space-y-2">
        <p>All uploads are secure and HIPAA compliant • No data is stored permanently</p>
        {!manualInput.trim() && !isProcessingDocument && (
          <p className="text-primary/60">💡 Enter a medication name above to see analysis options</p>
        )}
        {isProcessingDocument && (
          <p className="text-primary/60">📄 Processing your document - this may take a few moments...</p>
        )}
      </div>

      {/* Notification Popup */}
      <NotificationPopup
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={closeNotification}
        actionButton={notification.suggestions?.length ? {
          label: 'See Suggestions',
          onClick: () => {
            if (notification.suggestions && notification.suggestions.length > 0) {
              setManualInput(notification.suggestions[0]);
              closeNotification();
            }
          }
        } : undefined}
      />
    </div>
  );
};

export default UploadZone;