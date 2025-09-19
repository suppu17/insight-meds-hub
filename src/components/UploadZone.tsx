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
    <div className="space-y-4">
      {/* Lovable-style Input Container */}
      <div className="relative">
        <Input
          placeholder="Ask MedInsight to analyze a medication..."
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
          className="w-full px-4 py-2.5 pr-20 text-sm bg-stone-800/90 border-6 border-stone-700/70 rounded-xl focus:border-orange-500/70 focus:ring-2 focus:ring-orange-500/30 text-white placeholder:text-white transition-all hover:bg-stone-800 hover:border-stone-700"
        />

        {/* Right Side Controls */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {onHistoryView && (
            <Button
              onClick={onHistoryView}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 hover:bg-stone-700/50 rounded-lg"
            >
              <History className="w-4 h-4 text-gray-400" />
            </Button>
          )}
          {/* Upload Button */}
          <Button
            onClick={() => document.getElementById('file-upload')?.click()}
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 hover:bg-stone-700/50 rounded-lg"
            disabled={isProcessingDocument}
          >
            {isProcessingDocument ? (
              <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 text-gray-400" />
            )}
          </Button>
          <input
            id="file-upload"
            type="file"
            accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Compact Analysis Options - Only show when input has content */}
      {manualInput.trim() && (
        <div className="flex flex-wrap gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
          {analysisOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <Button
                key={option.id}
                onClick={() => {
                  if (option.id === 'visualize') {
                    if (!showVideoOptions) {
                      setShowVideoOptions(true);
                    }
                  } else {
                    setShowVideoOptions(false);
                    handleAnalysisSelect(option.id);
                  }
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 h-8 px-3 bg-stone-800/50 border-stone-600/50 hover:border-orange-500/50 hover:bg-stone-700/50 text-white/70 hover:text-white transition-colors"
              >
                <IconComponent className="w-3.5 h-3.5" />
                <span className="text-xs">{option.title}</span>
              </Button>
            );
          })}
        </div>
      )}

      {/* Video Options - Compact */}
      {showVideoOptions && (
        <div className="bg-stone-800/30 border border-stone-600/30 rounded-lg p-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
          <VideoDurationSelector
            selectedDuration={videoDuration}
            onDurationChange={handleDurationChange}
          />
          <div className="flex gap-2 mt-2">
            <Button
              onClick={() => handleAnalysisSelect('visualize')}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Generate Video
            </Button>
            <Button
              onClick={() => setShowVideoOptions(false)}
              size="sm"
              variant="outline"
              className="border-stone-600/50 hover:bg-stone-700/50"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Minimal Bottom Text */}
      <div className="text-center text-xs text-white">
        {isProcessingDocument ? (
          <span className="text-orange-400">Processing document...</span>
        ) : manualInput.trim() ? (
          <span>Choose analysis type above</span>
        ) : (
          <span>Enter medication name or upload prescription</span>
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