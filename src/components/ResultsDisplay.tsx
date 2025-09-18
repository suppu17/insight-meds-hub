import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, AlertTriangle, Clock, CheckCircle, ExternalLink, Brain, Video, Image, BarChart3, TrendingUp, Users, Cloud, Microscope, Pill, Eye } from "lucide-react";
import VideoGenerationProgress, { VideoGenerationStage } from "@/components/VideoGenerationProgress";
import VideoPlayer from "@/components/VideoPlayer";
import SegmentPreview from "@/components/SegmentPreview";
import PatientAnalysisDisplay from "@/components/PatientAnalysisDisplay";
import PicturizeImageGenerator from "@/components/PicturizeImageGenerator";
import { analyzeDrugMechanism, enhanceVideoPrompts, DrugAnalysisResult } from "@/lib/api/bedrock";
import { generateChainedVideo, generateMechanismImage, VideoSegment } from "@/lib/api/fal";
import { concatenateVideoSegments, concatenateVideoSegmentsWithTimeout, createVirtualCombinedVideo, CombinedVideoResult, VideoProcessingProgress } from "@/lib/api/videoProcessor";
import { getEnhancedVideoManager, EnhancedVideoResult, EnhancedVideoGenerationProgress } from "@/lib/api/enhanced-video-manager";
import EnhancedVideoPlayer from "@/components/EnhancedVideoPlayer";
import {
  generateVideoSegmentsWithPreviews,
  createPlaceholderSegments,
  getSegmentGenerationStatus,
  SegmentGenerationCallback
} from "@/lib/api/enhancedVideoGenerator";
import { drugAnalysisAPI, DrugAnalysisRequest, AnalysisProgress } from "@/lib/api/drugAnalysisApi";
import { generateClinicalRecommendations } from "@/lib/utils/clinicalDecisionSupport";

// Helper functions for comprehensive drug information display
const getDrugClass = (drugName: string): string => {
  const drugClasses: Record<string, string> = {
    'aspirin': 'Nonsteroidal Anti-inflammatory Drug (NSAID)',
    'ibuprofen': 'Nonsteroidal Anti-inflammatory Drug (NSAID)',
    'acetaminophen': 'Analgesic/Antipyretic',
    'paracetamol': 'Analgesic/Antipyretic',
    'metformin': 'Biguanide Antidiabetic',
    'lisinopril': 'ACE Inhibitor',
    'amlodipine': 'Calcium Channel Blocker',
    'simvastatin': 'HMG-CoA Reductase Inhibitor (Statin)',
    'atorvastatin': 'HMG-CoA Reductase Inhibitor (Statin)',
    'omeprazole': 'Proton Pump Inhibitor',
    'amoxicillin': 'Beta-lactam Antibiotic (Penicillin)',
    'warfarin': 'Anticoagulant (Vitamin K Antagonist)',
    'digoxin': 'Cardiac Glycoside',
    'furosemide': 'Loop Diuretic',
    'prednisone': 'Corticosteroid',
    'metoprolol': 'Beta-blocker',
    'hydrochlorothiazide': 'Thiazide Diuretic',
    'levothyroxine': 'Thyroid Hormone',
    'insulin': 'Antidiabetic Hormone',
    'morphine': 'Opioid Analgesic'
  };

  const normalizedName = drugName.toLowerCase().trim();
  return drugClasses[normalizedName] || 'Pharmaceutical Agent';
};

const getPrimaryIndication = (drugName: string): string => {
  const indications: Record<string, string> = {
    'aspirin': 'pain, inflammation, and cardiovascular protection',
    'ibuprofen': 'pain, fever, and inflammation',
    'acetaminophen': 'pain and fever',
    'paracetamol': 'pain and fever',
    'metformin': 'type 2 diabetes mellitus',
    'lisinopril': 'hypertension and heart failure',
    'amlodipine': 'hypertension and angina',
    'simvastatin': 'high cholesterol and cardiovascular risk reduction',
    'atorvastatin': 'high cholesterol and cardiovascular risk reduction',
    'omeprazole': 'gastroesophageal reflux disease (GERD) and peptic ulcers',
    'amoxicillin': 'bacterial infections',
    'warfarin': 'blood clot prevention',
    'digoxin': 'heart failure and atrial fibrillation',
    'furosemide': 'fluid retention (edema) and hypertension',
    'prednisone': 'inflammatory and autoimmune conditions',
    'metoprolol': 'hypertension, angina, and heart failure',
    'hydrochlorothiazide': 'hypertension and fluid retention',
    'levothyroxine': 'hypothyroidism',
    'insulin': 'diabetes mellitus',
    'morphine': 'moderate to severe pain'
  };

  const normalizedName = drugName.toLowerCase().trim();
  return indications[normalizedName] || 'various medical conditions as prescribed by healthcare providers';
};

const getMedicationUses = (drugName: string): string[] => {
  const uses: Record<string, string[]> = {
    'aspirin': [
      'Pain relief (headaches, muscle aches)',
      'Reduce inflammation and swelling',
      'Lower fever',
      'Prevent heart attacks and strokes',
      'Reduce blood clot formation'
    ],
    'ibuprofen': [
      'Pain relief (headaches, dental pain, menstrual cramps)',
      'Reduce inflammation (arthritis, sports injuries)',
      'Lower fever',
      'Treat minor aches and pains'
    ],
    'metformin': [
      'Lower blood sugar in type 2 diabetes',
      'Improve insulin sensitivity',
      'Support weight management in diabetic patients',
      'Reduce risk of diabetic complications'
    ],
    'lisinopril': [
      'Lower blood pressure (hypertension)',
      'Treat heart failure',
      'Protect kidneys in diabetic patients',
      'Prevent cardiovascular events'
    ],
    'omeprazole': [
      'Treat gastroesophageal reflux disease (GERD)',
      'Heal peptic ulcers',
      'Prevent stomach ulcers caused by NSAIDs',
      'Treat Zollinger-Ellison syndrome'
    ]
  };

  const normalizedName = drugName.toLowerCase().trim();
  return uses[normalizedName] || [
    'Treat specific medical conditions',
    'Manage symptoms as prescribed',
    'Support overall health outcomes',
    'Prevent disease progression'
  ];
};

const getCommonSideEffects = (drugName: string): string[] => {
  const sideEffects: Record<string, string[]> = {
    'aspirin': [
      'Stomach irritation or upset',
      'Increased bleeding risk',
      'Nausea or heartburn',
      'Ringing in ears (tinnitus)'
    ],
    'ibuprofen': [
      'Stomach upset or pain',
      'Nausea or vomiting',
      'Dizziness or drowsiness',
      'Headache'
    ],
    'metformin': [
      'Nausea or vomiting',
      'Diarrhea or stomach upset',
      'Loss of appetite',
      'Metallic taste in mouth'
    ],
    'lisinopril': [
      'Dry cough',
      'Dizziness or lightheadedness',
      'Fatigue or weakness',
      'Headache'
    ],
    'omeprazole': [
      'Headache',
      'Nausea or stomach pain',
      'Diarrhea or constipation',
      'Dizziness'
    ]
  };

  const normalizedName = drugName.toLowerCase().trim();
  return sideEffects[normalizedName] || [
    'Nausea or stomach upset',
    'Dizziness or headache',
    'Changes in appetite',
    'Mild allergic reactions'
  ];
};

const getContraindications = (drugName: string): string[] => {
  const contraindications: Record<string, string[]> = {
    'aspirin': [
      'Allergy to aspirin or salicylates',
      'Active bleeding or bleeding disorders',
      'Severe kidney or liver disease',
      'Children with viral infections (Reye\'s syndrome risk)'
    ],
    'ibuprofen': [
      'Allergy to NSAIDs',
      'History of asthma attacks with NSAIDs',
      'Active peptic ulcer disease',
      'Severe heart, kidney, or liver disease'
    ],
    'metformin': [
      'Severe kidney disease',
      'Metabolic acidosis',
      'Severe liver disease',
      'Conditions causing dehydration'
    ],
    'lisinopril': [
      'Pregnancy (especially 2nd and 3rd trimesters)',
      'History of angioedema',
      'Bilateral renal artery stenosis',
      'Hyperkalemia (high potassium)'
    ],
    'omeprazole': [
      'Allergy to proton pump inhibitors',
      'Concurrent use with rilpivirine',
      'Severe liver impairment',
      'Long-term use concerns (bone fractures, B12 deficiency)'
    ]
  };

  const normalizedName = drugName.toLowerCase().trim();
  return contraindications[normalizedName] || [
    'Known allergy to this medication',
    'Severe liver or kidney disease',
    'Pregnancy (unless specifically advised)',
    'Certain medical conditions (consult doctor)'
  ];
};

const getDrugInteractions = (drugName: string): string[] => {
  const interactions: Record<string, string[]> = {
    'aspirin': [
      'Warfarin (increased bleeding risk)',
      'ACE inhibitors (reduced effectiveness)',
      'Methotrexate (increased toxicity)',
      'Alcohol (increased stomach bleeding risk)'
    ],
    'ibuprofen': [
      'Blood thinners (warfarin, heparin)',
      'ACE inhibitors or ARBs',
      'Lithium (increased lithium levels)',
      'Steroids (increased ulcer risk)'
    ],
    'metformin': [
      'Contrast dyes (kidney damage risk)',
      'Alcohol (lactic acidosis risk)',
      'Diuretics (dehydration concerns)',
      'Steroids (blood sugar effects)'
    ],
    'lisinopril': [
      'NSAIDs (reduced kidney function)',
      'Potassium supplements (hyperkalemia)',
      'Diuretics (excessive blood pressure drop)',
      'Lithium (increased lithium levels)'
    ],
    'omeprazole': [
      'Clopidogrel (reduced antiplatelet effect)',
      'Warfarin (altered bleeding risk)',
      'Digoxin (increased digoxin levels)',
      'Iron supplements (reduced absorption)'
    ]
  };

  const normalizedName = drugName.toLowerCase().trim();
  return interactions[normalizedName] || [
    'Blood thinning medications',
    'Other prescription medications',
    'Over-the-counter supplements',
    'Certain foods or beverages'
  ];
};

// Interface for extracted medical information (matching documentProcessor.ts)
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
    gender?: string;
    mrn?: string;
  };
  vitals?: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    respiratoryRate?: string;
    oxygenSaturation?: string;
    weight?: string;
    height?: string;
    bmi?: string;
  };
  medicalHistory?: {
    pastMedicalHistory?: string[];
    familyHistory?: string[];
    socialHistory?: string[];
    surgicalHistory?: string[];
    allergies?: string[];
    chronicConditions?: string[];
  };
  concomitantMedications?: {
    medication: string;
    dosage: string;
    frequency: string;
    indication: string;
    startDate?: string;
  }[];
  labResults?: {
    testName: string;
    value: string;
    unit?: string;
    referenceRange?: string;
    date?: string;
  }[];
  assessment?: {
    primaryDiagnosis?: string;
    secondaryDiagnoses?: string[];
    treatmentPlan?: string[];
    followUpInstructions?: string[];
  };
  prescriber?: {
    name?: string;
    npi?: string;
    clinic?: string;
    specialty?: string;
    contactInfo?: string;
  };
  documentInfo?: {
    type: 'prescription' | 'medical_report' | 'lab_report' | 'discharge_summary' | 'other';
    date?: string;
    facility?: string;
  };
  rawText: string;
}

interface ResultsDisplayProps {
  action: string;
  data: {
    medication?: string;
    files?: File[];
    type?: 'upload' | 'manual' | 'document';
    videoDuration?: string;
    videoStrategy?: string;
    extractedInfo?: ExtractedMedicalInfo; // Medical info extracted from document
  } | null;
  onBack: () => void;
}

const ResultsDisplay = ({ action, data, onBack }: ResultsDisplayProps) => {
  const [isLoading, setIsLoading] = useState(true);

  // Video generation states
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoGenerationStage, setVideoGenerationStage] = useState(0);
  const [videoStages, setVideoStages] = useState<VideoGenerationStage[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');
  const [drugAnalysis, setDrugAnalysis] = useState<DrugAnalysisResult | null>(null);
  const [videoSegments, setVideoSegments] = useState<VideoSegment[]>([]);
  const [completedSegments, setCompletedSegments] = useState<VideoSegment[]>([]);
  const [placeholderSegments, setPlaceholderSegments] = useState<VideoSegment[]>([]);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [finalVideo, setFinalVideo] = useState<CombinedVideoResult | null>(null);
  const [enhancedVideo, setEnhancedVideo] = useState<EnhancedVideoResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showSegmentPreviews, setShowSegmentPreviews] = useState(false);
  const [useEnhancedGeneration, setUseEnhancedGeneration] = useState(true);

  // Backend API integration states
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [marketData, setMarketData] = useState<any>(null);
  const [competitorData, setCompetitorData] = useState<any>(null);
  const [pricingData, setPricingData] = useState<any>(null);
  const [clinicalTrials, setClinicalTrials] = useState<any[]>([]);
  const [executiveSummary, setExecutiveSummary] = useState<string | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  useEffect(() => {
    if (action === 'visualize') {
      // Start video generation immediately for visualize action
      startVideoGeneration();
    } else if (action === 'picturize') {
      // For picturize, we need drug analysis to generate proper image prompts
      startDrugAnalysisOnly();
    } else {
      // Start backend analysis for other actions
      startBackendAnalysis();
    }

    // Cleanup function to close any open event sources
    return () => {
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, data]);

  // Start drug analysis only (for picturize action)
  const startDrugAnalysisOnly = async () => {
    if (!data?.medication) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setCurrentMessage(`Analyzing ${data.medication} for image generation...`);

    try {
      const drugName = data.medication;

      // Use the bedrock API directly for drug mechanism analysis
      const analysis = await analyzeDrugMechanism(drugName);
      setDrugAnalysis(analysis);
      setIsLoading(false);
      setCurrentMessage('Ready to generate images');
    } catch (error) {
      console.error('Failed to analyze drug for picturize:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to analyze medication');
      setIsLoading(false);
    }
  };

  // Start backend analysis for non-video actions
  const startBackendAnalysis = async () => {
    if (!data?.medication) {
      setIsLoading(false);
      return;
    }

    try {
      const drugName = data.medication;
      const analysisType = getAnalysisTypeFromAction(action);

      // Start drug analysis
      const analysisResponse = await drugAnalysisAPI.startDrugAnalysis({
        drug_name: drugName,
        analysis_type: analysisType,
        include_competitors: true,
        include_market_data: true,
        include_clinical_data: true
      });

      setAnalysisId(analysisResponse.analysis_id);
      setCurrentMessage(`Starting ${action} analysis for ${drugName}...`);

      // Set up streaming connection
      const stream = drugAnalysisAPI.createAnalysisStream(analysisResponse.analysis_id);
      setEventSource(stream);

      stream.onmessage = (event) => {
        try {
          const progressData: AnalysisProgress = JSON.parse(event.data);
          setAnalysisProgress(progressData);
          setCurrentMessage(progressData.message || progressData.current_step);
          setOverallProgress(progressData.progress_percentage);

          if (progressData.status === 'completed' && progressData.results) {
            setAnalysisResults(progressData.results);
            setExecutiveSummary(progressData.executive_summary || null);
            setIsLoading(false);

            // Load additional market data
            loadMarketIntelligence(drugName);
          }

          if (progressData.status === 'failed') {
            setGenerationError(progressData.message || 'Analysis failed');
            setIsLoading(false);
          }
        } catch (error) {
          console.error('Failed to parse progress data:', error);
        }
      };

      stream.onerror = (error) => {
        console.error('Stream error:', error);
        setGenerationError('Connection to analysis service failed');
        setIsLoading(false);
        stream.close();
      };

    } catch (error) {
      console.error('Failed to start analysis:', error);
      setGenerationError(error instanceof Error ? error.message : 'Failed to start analysis');
      setIsLoading(false);
    }
  };

  // Map action to analysis type
  const getAnalysisTypeFromAction = (action: string): DrugAnalysisRequest['analysis_type'] => {
    switch (action) {
      case 'overview':
        return 'overview';
      case 'research':
        return 'clinical_trials';
      case 'deep_research':
        return 'market_research';  // Uses multi-agent intelligence with Bright Data
      case 'competitive':
        return 'competitive_analysis';
      case 'pricing':
        return 'pricing_analysis';
      case 'safety':
        return 'safety_profile';
      default:
        return 'market_research';
    }
  };

  // Load additional market intelligence data
  const loadMarketIntelligence = async (drugName: string) => {
    try {
      // Load market data, competitors, and pricing in parallel
      const [marketResp, competitorResp, pricingResp] = await Promise.allSettled([
        drugAnalysisAPI.getMarketIntelligence(drugName),
        drugAnalysisAPI.getCompetitorAnalysis(drugName),
        drugAnalysisAPI.getPricingAnalysis(drugName)
      ]);

      if (marketResp.status === 'fulfilled') {
        setMarketData(marketResp.value);
      }

      if (competitorResp.status === 'fulfilled') {
        setCompetitorData(competitorResp.value);
      }

      if (pricingResp.status === 'fulfilled') {
        setPricingData(pricingResp.value);
      }
    } catch (error) {
      console.error('Failed to load market intelligence:', error);
    }
  };

  // Initialize video generation stages
  const initializeVideoStages = (): VideoGenerationStage[] => [
    {
      id: 'analysis',
      name: 'Drug Analysis',
      description: 'Analyzing drug mechanism with AWS Bedrock Claude',
      status: 'pending',
      icon: Brain
    },
    {
      id: 'script',
      name: 'Script Generation',
      description: 'Creating educational video script',
      status: 'pending',
      icon: Brain
    },
    {
      id: 'video-segments',
      name: 'Video Segments',
      description: 'Generating 4 video segments (30 seconds total)',
      status: 'pending',
      icon: Video
    },
    {
      id: 'preparation',
      name: 'Segment Preparation',
      description: 'Making individual segments ready for viewing',
      status: 'pending',
      icon: Video
    }
  ];

  const startVideoGeneration = async () => {
    setIsGeneratingVideo(true);
    setIsLoading(false);
    setGenerationError(null);

    // Check if enhanced generation is enabled and available
    if (useEnhancedGeneration) {
      try {
        await startEnhancedVideoGeneration();
        return;
      } catch (error) {
        console.warn('Enhanced video generation failed, falling back to legacy method:', error);
        setUseEnhancedGeneration(false);
      }
    }

    // Legacy video generation method
    await startLegacyVideoGeneration();
  };

  const startEnhancedVideoGeneration = async () => {
    const drugName = data?.medication || 'Aspirin';

    // Initialize placeholder segments for immediate UI feedback
    const placeholders = createPlaceholderSegments();
    setPlaceholderSegments(placeholders);
    setShowSegmentPreviews(true);

    const stages = initializeVideoStages();
    setVideoStages(stages);
    setOverallProgress(0);

    try {
      const videoManager = getEnhancedVideoManager();

      // Get video configuration from environment, user selection, or defaults
      const videoOptions = {
        quality: (import.meta.env.VITE_VIDEO_QUALITY_DEFAULT || 'medium') as 'high' | 'medium' | 'low',
        format: (import.meta.env.VITE_VIDEO_FORMAT_DEFAULT || 'mp4') as 'mp4' | 'webm',
        uploadToS3: import.meta.env.VITE_S3_UPLOAD_ENABLED !== 'false',
        generateThumbnail: true,
        uploadSegments: false, // Don't upload individual segments by default
        s3ExpirationMinutes: parseInt(import.meta.env.VITE_S3_PRESIGNED_URL_EXPIRATION_MINUTES || '60'),

        // New parallel generation options
        duration: (data?.videoDuration as '8s' | '16s' | '30s') || '8s',
        useParallelGeneration: true,
        generationStrategy: data?.videoStrategy as any || 'parallel'
      };

      const result = await videoManager.generateCompleteVideo(
        drugName,
        videoOptions,
        {
          onProgress: (progress: EnhancedVideoGenerationProgress) => {
            setOverallProgress(progress.progress);
            setCurrentMessage(progress.message);

            // Update stage based on progress stage
            if (progress.stage === 'analysis') {
              updateStage(0, 'in_progress', progress.message);
              if (progress.progress >= 20) updateStage(0, 'completed', 'Drug analysis complete');
            } else if (progress.stage === 'script') {
              updateStage(1, 'in_progress', progress.message);
              if (progress.progress >= 30) updateStage(1, 'completed', 'Script generation complete');
            } else if (progress.stage === 'segments') {
              updateStage(2, 'in_progress', progress.message);
              if (progress.completedSegments) {
                setCompletedSegments(progress.completedSegments);
              }
              if (progress.progress >= 55) updateStage(2, 'completed', 'All video segments generated');
            } else if (progress.stage === 'concatenation') {
              updateStage(3, 'in_progress', progress.message);
              if (progress.progress >= 80) updateStage(3, 'completed', 'Video concatenation complete');
            } else if (progress.stage === 'upload') {
              // Add upload stage if not exists
              if (videoStages.length <= 4) {
                setVideoStages(prev => [...prev, {
                  id: 'upload',
                  name: 'Cloud Upload',
                  description: 'Uploading to AWS S3',
                  status: 'in_progress',
                  icon: Cloud
                }]);
              } else {
                updateStage(4, 'in_progress', progress.message);
              }
            } else if (progress.stage === 'complete') {
              setVideoStages(prev => prev.map(stage => ({ ...stage, status: 'completed' as const })));
            }
          },
          onSegmentComplete: (segment, index, total) => {
            setCompletedSegments(prev => {
              const updated = [...prev];
              const existingIndex = updated.findIndex(s => s.segmentNumber === segment.segmentNumber);
              if (existingIndex >= 0) {
                updated[existingIndex] = segment;
              } else {
                updated.push(segment);
              }
              return updated.sort((a, b) => a.segmentNumber - b.segmentNumber);
            });

            setCurrentMessage(`Segment ${segment.segmentNumber}/${total} completed!`);
          },
          onAnalysisComplete: (analysis) => {
            setDrugAnalysis(analysis);
          }
        }
      );

      // Set the enhanced video result
      setEnhancedVideo(result);
      setVideoSegments(result.segments);
      setIsGeneratingVideo(false);
      setOverallProgress(100);
      setCurrentMessage(`Enhanced video generation complete! (${Math.round(result.processingTime / 1000)}s)`);

      // Also set legacy finalVideo for compatibility
      setFinalVideo({
        videoBlob: result.videoBlob,
        duration: result.duration,
        segments: result.segments
      });

    } catch (error) {
      console.error('Enhanced video generation failed:', error);
      setGenerationError(error instanceof Error ? error.message : 'Unknown error occurred');
      setIsGeneratingVideo(false);

      // Mark current stage as error
      const currentStageIndex = videoStages.findIndex(stage => stage.status === 'in_progress');
      if (currentStageIndex !== -1) {
        updateStage(currentStageIndex, 'error', `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Fall back to legacy method if enhanced fails
      throw error;
    }
  };

  const startLegacyVideoGeneration = async () => {
    // Initialize placeholder segments for immediate UI feedback
    const placeholders = createPlaceholderSegments();
    setPlaceholderSegments(placeholders);
    setShowSegmentPreviews(true);

    const stages = initializeVideoStages();
    setVideoStages(stages);
    setOverallProgress(0);

    try {
      const drugName = data?.medication || 'Aspirin'; // fallback for testing

      // Stage 1: Drug Analysis
      updateStage(0, 'in_progress', 'Analyzing drug mechanism...');
      setCurrentMessage('Analyzing drug with AWS Bedrock Claude...');

      const analysis = await analyzeDrugMechanism(drugName);
      setDrugAnalysis(analysis);

      updateStage(0, 'completed', 'Drug analysis complete');
      setOverallProgress(20);

      // Stage 2: Script Enhancement
      updateStage(1, 'in_progress', 'Creating video script...');
      setCurrentMessage('Enhancing video prompts for optimal generation...');

      const enhancedPrompts = await enhanceVideoPrompts(analysis);

      updateStage(1, 'completed', 'Script generation complete');
      setOverallProgress(40);

      // Stage 3: Enhanced Video Generation with Live Preview
      updateStage(2, 'in_progress', 'Generating video segments...');
      setCurrentMessage('Starting enhanced video generation with live preview...');

      // Create callbacks for segment generation
      const callbacks: SegmentGenerationCallback = {
        onSegmentStart: (segmentNumber) => {
          setCurrentSegment(segmentNumber);
          setCurrentMessage(`Generating segment ${segmentNumber}/4...`);
        },
        onSegmentComplete: (segment) => {
          // Add completed segment immediately to state
          setCompletedSegments(prev => [...prev, segment]);
          setCurrentMessage(`Segment ${segment.segmentNumber}/4 completed!`);

          // Update progress based on completed segments
          const progress = 40 + ((segment.segmentNumber / 4) * 30);
          setOverallProgress(progress);
        },
        onProgress: (segmentNumber, total, message) => {
          setCurrentMessage(`Segment ${segmentNumber}/${total}: ${message}`);
        },
        onError: (segmentNumber, error) => {
          console.error(`Segment ${segmentNumber} failed:`, error);
          setCurrentMessage(`Segment ${segmentNumber} failed: ${error.message}`);
        }
      };

      // Use enhanced video generation
      const segments = await generateVideoSegmentsWithPreviews(
        drugName,
        enhancedPrompts,
        callbacks
      );

      setVideoSegments(segments);
      updateStage(2, 'completed', 'All video segments generated');
      setOverallProgress(70);

      // Stage 4: Immediate Virtual Video (Non-blocking)
      updateStage(3, 'in_progress', 'Preparing individual segments...');
      setCurrentMessage('Making segments ready for viewing...');

      // Create virtual combined video immediately - no blocking concatenation
      const virtualVideo = await createVirtualCombinedVideo(
        segments,
        (progress: VideoProcessingProgress) => {
          setCurrentMessage(`Preparing segments: ${progress.message}`);
          const prepProgress = 70 + ((progress.progress / 100) * 10); // 10% for prep
          setOverallProgress(prepProgress);
        }
      );

      setFinalVideo(virtualVideo);
      updateStage(3, 'completed', 'Individual segments ready to play');
      setOverallProgress(80);

      // Mark generation as complete - users can now access content
      setIsGeneratingVideo(false);

      // Mark final progress as complete
      setOverallProgress(100);
      setCurrentMessage('Video segments ready! You can now watch them.');

      // Optional: Try background concatenation (non-blocking)
      backgroundConcatenation(segments);

      // Optional: Generate mechanism images in background (non-blocking)
      backgroundImageGeneration(analysis);

    } catch (error) {
      console.error('Video generation failed:', error);
      setGenerationError(error instanceof Error ? error.message : 'Unknown error occurred');
      setIsGeneratingVideo(false);

      // Mark current stage as error
      const currentStageIndex = videoStages.findIndex(stage => stage.status === 'in_progress');
      if (currentStageIndex !== -1) {
        updateStage(currentStageIndex, 'error', `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const updateStage = (index: number, status: VideoGenerationStage['status'], message?: string) => {
    setVideoStages(prev => prev.map((stage, i) =>
      i === index ? { ...stage, status, message } : stage
    ));
  };

  // Background concatenation - runs without blocking UI
  const backgroundConcatenation = async (segments: VideoSegment[]) => {
    try {
      console.log('Starting background video concatenation...');

      const combinedVideo = await concatenateVideoSegmentsWithTimeout(
        segments,
        (progress: VideoProcessingProgress) => {
          console.log(`Background concatenation: ${progress.message}`);
          // Optionally update a subtle progress indicator
          if (progress.stage === 'complete') {
            setCurrentMessage('Combined video is now ready!');
          }
        },
        30000 // 30 second timeout
      );

      // If successful, update the final video and notify user
      setFinalVideo(combinedVideo);
      setCurrentMessage('Combined 30-second video is now available for download!');
      console.log('Background concatenation completed successfully!');

    } catch (error) {
      console.warn('Background concatenation failed (this is expected and OK):', error);
      // Provide helpful feedback without alarming the user
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log('Video concatenation timed out - individual segments remain available');
      } else {
        console.log('Video concatenation had issues - individual segments remain available');
      }
      // Don't show error to user - individual segments are the main feature
    }
  };

  // Background image generation - runs without blocking UI
  const backgroundImageGeneration = async (analysis: DrugAnalysisResult) => {
    try {
      console.log('Starting background image generation...');

      await generateMechanismImage(analysis.imagePrompts.mechanismDiagram);

      console.log('Background image generation completed successfully!');

    } catch (error) {
      console.warn('Background image generation failed (this is expected and OK):', error);
      // Don't show error to user - video segments are the main feature
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="glass-panel rounded-full p-6 w-fit mx-auto animate-pulse">
              <Brain className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">
              {action === 'visualize' ? 'Generating Visualization...' :
               action === 'deep_research' ? 'Running Deep Research Analysis...' :
               'Analyzing Your Medication...'}
            </h3>
            <p className="text-muted-foreground">
              {action === 'deep_research'
                ? currentMessage || 'Multi-agent AI with Claude Sonnet, NOVA Premier, and Bright Data intelligence is conducting comprehensive research...'
                : currentMessage || 'Our AI is processing your request and gathering the latest medical information.'
              }
            </p>

            {/* Progress bar for backend analysis */}
            {overallProgress > 0 && (
              <div className="w-full max-w-md mx-auto">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>Progress</span>
                  <span>{overallProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-primary transition-all duration-500 ease-out"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Real-time analysis steps */}
          {analysisProgress && (
            <Card className="glass-card p-6">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                {action === 'deep_research' ? (
                  <>
                    <Microscope className="w-5 h-5 text-primary" />
                    Multi-Agent Intelligence Pipeline
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Analysis Pipeline
                  </>
                )}
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Current Step:</span>
                  <Badge variant="secondary">{analysisProgress.current_step}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Status:</span>
                  <Badge
                    variant={analysisProgress.status === 'completed' ? 'default' : 'secondary'}
                    className={analysisProgress.status === 'in_progress' ? 'animate-pulse' : ''}
                  >
                    {analysisProgress.status}
                  </Badge>
                </div>
                {action === 'deep_research' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">AI Models:</span>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs">Claude</Badge>
                        <Badge variant="outline" className="text-xs">NOVA</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Data Sources:</span>
                      <Badge variant="outline" className="text-xs">Bright Data + FDA + PubMed</Badge>
                    </div>
                  </>
                )}
                {analysisId && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Analysis ID:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {analysisId.slice(0, 8)}...
                    </code>
                  </div>
                )}
              </div>
            </Card>
          )}

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
      case 'visualize':
        if (isGeneratingVideo) {
          // Get segment statuses for live preview
          const segmentStatuses = getSegmentGenerationStatus(
            placeholderSegments,
            completedSegments,
            currentSegment
          );

          return (
            <div className="space-y-6">
              {/* Main Progress */}
              <VideoGenerationProgress
                currentStage={videoGenerationStage}
                stages={videoStages}
                overallProgress={overallProgress}
                currentMessage={currentMessage}
                estimatedTimeRemaining={120} // 2 minutes estimate
                onCancel={() => {
                  setIsGeneratingVideo(false);
                  setGenerationError('Generation cancelled by user');
                }}
              />

              {/* Live Segment Previews */}
              {showSegmentPreviews && segmentStatuses.length > 0 && (
                <Card className="glass-card p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Video className="w-6 h-6 text-primary" />
                    Video Segments Preview
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Watch segments as they complete - no need to wait for the full video!
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {segmentStatuses.map(({ segment, isCompleted, isGenerating }) => (
                      <SegmentPreview
                        key={segment.segmentNumber}
                        segment={segment}
                        isCompleted={isCompleted}
                        isGenerating={isGenerating}
                        onPlay={(segmentNumber) => {
                          console.log(`Playing segment ${segmentNumber}`);
                        }}
                      />
                    ))}
                  </div>

                  {completedSegments.length > 0 && (
                    <div className="mt-4 p-3 glass-panel rounded-lg bg-success/5 border-success/20">
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {completedSegments.length} of 4 segments ready to watch!
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>
          );
        }

        if (generationError) {
          return (
            <Card className="glass-card p-6">
              <div className="text-center space-y-4">
                <div className="glass-panel rounded-full p-6 w-fit mx-auto bg-destructive/10">
                  <AlertTriangle className="w-12 h-12 text-destructive" />
                </div>
                <h3 className="text-xl font-semibold text-destructive">Generation Failed</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {generationError}
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => startVideoGeneration()}
                    variant="outline"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={onBack}
                    variant="ghost"
                  >
                    Go Back
                  </Button>
                </div>
              </div>
            </Card>
          );
        }

        if ((enhancedVideo || finalVideo || completedSegments.length > 0) && drugAnalysis) {
          return (
            <div className="space-y-6">
              {/* Success Message */}
              <Card className="glass-card p-6 bg-success/5 border-success/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-success" />
                  <div>
                    <h3 className="font-semibold text-success">
                      {enhancedVideo ? 'Enhanced Video Generation Complete!' : 'Video Generation Complete!'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {completedSegments.length} video segments ready to watch immediately.
                      {enhancedVideo ? (
                        ` Professional ${enhancedVideo.format.toUpperCase()} video with ${enhancedVideo.quality} quality is ready for download.${enhancedVideo.s3Upload ? ' Video is also stored in AWS S3.' : ''}`
                      ) : (
                        finalVideo?.videoBlob?.size && finalVideo.videoBlob.size > 100
                        ? ' Combined 30-second video is also ready for download.'
                        : ' Combined video may become available shortly - individual segments provide the full educational content.'
                      )}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Enhanced Video Player (preferred) */}
              {enhancedVideo && (
                <>
                  <Card className="glass-card p-4 bg-primary/5 border-primary/20 mb-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-primary">
                          Professional Video Ready!
                          {enhancedVideo.s3Upload && <span className="text-xs ml-2">📁 Cloud Stored</span>}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {enhancedVideo.format.toUpperCase()} video with {enhancedVideo.quality} quality,
                          FFmpeg concatenation, and multiple download options available.
                        </p>
                      </div>
                    </div>
                  </Card>

                  <EnhancedVideoPlayer
                    videoResult={enhancedVideo}
                    title={`${drugAnalysis.drugName} - Mechanism of Action`}
                    description="AI-generated professional educational video with enhanced features"
                    showDownloadOptions={true}
                    showS3Info={!!enhancedVideo.s3Upload}
                  />
                </>
              )}

              {/* Legacy Video Player (fallback) */}
              {!enhancedVideo && finalVideo && finalVideo.videoBlob.size > 100 && (
                <>
                  <Card className="glass-card p-4 bg-primary/5 border-primary/20 mb-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-primary">Combined Video Ready!</p>
                        <p className="text-sm text-muted-foreground">
                          The full 30-second video has been assembled and is ready to watch or download.
                        </p>
                      </div>
                    </div>
                  </Card>

                  <VideoPlayer
                    videoBlob={finalVideo.videoBlob}
                    segments={finalVideo.segments}
                    duration={finalVideo.duration}
                    title={`${drugAnalysis.drugName} - Mechanism of Action`}
                    description="AI-generated educational video explaining drug mechanism"
                    onDownload={() => {
                      const url = URL.createObjectURL(finalVideo.videoBlob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${drugAnalysis.drugName}-mechanism-video.webm`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    onShare={() => {
                      if (navigator.share && finalVideo) {
                        navigator.share({
                          title: `${drugAnalysis.drugName} - Mechanism of Action`,
                          text: 'Educational video explaining drug mechanism of action',
                        });
                      }
                    }}
                  />
                </>
              )}

              {/* Individual Segments */}
              {completedSegments.length > 0 && (
                <Card className="glass-card p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Video className="w-6 h-6 text-accent" />
                    Individual Video Segments
                    <Badge variant="secondary" className="ml-2">
                      {completedSegments.length} segments
                    </Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Each segment can be watched independently or together to form the complete explanation.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {completedSegments.map((segment) => (
                      <SegmentPreview
                        key={segment.segmentNumber}
                        segment={segment}
                        isCompleted={true}
                        isGenerating={false}
                        onPlay={(segmentNumber) => {
                          console.log(`Playing segment ${segmentNumber}`);
                        }}
                        className="h-full"
                      />
                    ))}
                  </div>

                  {(!finalVideo || finalVideo.videoBlob.size <= 100) && completedSegments.length === 4 && (
                    <div className="mt-4 p-4 glass-panel rounded-lg bg-primary/5 border-primary/20">
                      <div className="text-center">
                        <Video className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <p className="font-medium text-primary mb-1">Individual segments ready!</p>
                        <p className="text-sm text-muted-foreground">
                          Combined video is still processing in the background. You can watch individual segments now.
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* Drug Analysis Summary */}
              <Card className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-primary" />
                  Mechanism Analysis
                </h3>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-primary mb-2">How It Works</h4>
                    <p className="text-muted-foreground">{drugAnalysis.mechanismOfAction}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-success mb-2">Key Points</h4>
                      <ul className="space-y-1">
                        {drugAnalysis.keyPoints.map((point, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-success" />
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-warning mb-2">Safety Information</h4>
                      <ul className="space-y-1">
                        {drugAnalysis.safetyWarnings.map((warning, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="w-4 h-4 text-warning" />
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Video Generation Info */}
              <Card className="glass-card p-4 bg-accent/5 border-accent/20">
                <div className="flex items-start gap-3">
                  <Video className="w-5 h-5 text-accent mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-accent mb-1">AI-Generated Educational Content</p>
                    <p className="text-muted-foreground">
                      This 30-second video was generated using advanced AI models including AWS Bedrock Claude for analysis
                      and fal.ai Veo 3 for video creation. The content combines 4 segments covering introduction,
                      mechanism details, therapeutic effects, and safety information.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">4 Segments</Badge>
                      <Badge variant="secondary" className="text-xs">30 Seconds</Badge>
                      <Badge variant="secondary" className="text-xs">AI Generated</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          );
        }

        // Fallback loading state
        return (
          <Card className="glass-card p-6">
            <div className="text-center space-y-4">
              <div className="glass-panel rounded-full p-6 w-fit mx-auto animate-pulse">
                <Video className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Preparing Video Generation...</h3>
              <p className="text-muted-foreground">
                Initializing AI models for educational video creation.
              </p>
            </div>
          </Card>
        );

      case 'overview': {
        const drugName = data?.medication || 'Unknown Drug';

        // Generate personalized clinical recommendations if we have patient data
        const clinicalRecommendations = data?.extractedInfo ? generateClinicalRecommendations(
          drugName,
          {
            age: data.extractedInfo.patientInfo?.age,
            gender: data.extractedInfo.patientInfo?.gender,
            weight: data.extractedInfo.vitals?.weight,
            height: data.extractedInfo.vitals?.height,
            bmi: data.extractedInfo.vitals?.bmi,
            allergies: data.extractedInfo.medicalHistory?.allergies,
            medicalHistory: data.extractedInfo.medicalHistory?.pastMedicalHistory,
            concomitantMedications: data.extractedInfo.concomitantMedications,
            labResults: data.extractedInfo.labResults,
            vitals: data.extractedInfo.vitals
          }
        ) : undefined;

        return (
          <div className="space-y-6">
            {/* Comprehensive Patient Analysis - Show when document was processed */}
            {data?.extractedInfo && (
              <PatientAnalysisDisplay
                extractedInfo={data.extractedInfo}
                primaryMedication={drugName}
                recommendations={clinicalRecommendations}
              />
            )}

            {/* Executive Summary */}
            {executiveSummary && (
              <Card className="glass-card p-6 bg-primary/5 border-primary/20">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-primary" />
                  AI Executive Summary
                </h3>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p className="whitespace-pre-wrap">{executiveSummary}</p>
                </div>
              </Card>
            )}

            {/* Comprehensive Drug Information */}
            <Card className="glass-card p-6 bg-blue/5 border-blue/20">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Eye className="w-6 h-6 text-blue-600" />
                {drugName} - Complete Overview
              </h3>
              <p className="text-muted-foreground mb-6 text-lg">
                Comprehensive medication information including uses, mechanism, side effects, and precautions.
              </p>

              {drugAnalysis ? (
                <div className="space-y-6">
                  {/* What It Is & Primary Use */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white/50 rounded-lg p-4 border border-blue/20">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <Pill className="w-5 h-5" />
                        What is {drugName}?
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {drugName} is a {getDrugClass(drugName)} medication primarily used to treat {getPrimaryIndication(drugName)}.
                        It works by {drugAnalysis.mechanismOfAction.split('.')[0].toLowerCase()}.
                      </p>
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">
                          <strong>Drug Class:</strong> {getDrugClass(drugName)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <strong>Generic Name:</strong> {drugName}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/50 rounded-lg p-4 border border-green/20">
                      <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Primary Uses & Benefits
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {getMedicationUses(drugName).map((use, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-muted-foreground">{use}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Mechanism of Action */}
                  <div className="bg-white/50 rounded-lg p-4 border border-purple/20">
                    <h4 className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      How It Works (Mechanism of Action)
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {drugAnalysis.mechanismOfAction}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {drugAnalysis.keyPoints.map((point, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs bg-purple/5 p-2 rounded">
                          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0"></span>
                          <span className="text-muted-foreground">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Side Effects & Safety */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white/50 rounded-lg p-4 border border-orange/20">
                      <h4 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Common Side Effects
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {getCommonSideEffects(drugName).map((effect, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <AlertTriangle className="w-3 h-3 text-orange-500 mt-1 flex-shrink-0" />
                            <span className="text-muted-foreground">{effect}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white/50 rounded-lg p-4 border border-red/20">
                      <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Important Precautions
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {drugAnalysis.safetyWarnings.map((warning, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Shield className="w-3 h-3 text-red-500 mt-1 flex-shrink-0" />
                            <span className="text-muted-foreground">{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Contraindications & Drug Interactions */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white/50 rounded-lg p-4 border border-red/20">
                      <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                        <ExternalLink className="w-5 h-5" />
                        Contraindications
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {getContraindications(drugName).map((contra, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ExternalLink className="w-3 h-3 text-red-500 mt-1 flex-shrink-0" />
                            <span className="text-muted-foreground">{contra}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white/50 rounded-lg p-4 border border-yellow/20">
                      <h4 className="font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Drug Interactions
                      </h4>
                      <ul className="space-y-2 text-sm">
                        {getDrugInteractions(drugName).map((interaction, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Users className="w-3 h-3 text-yellow-600 mt-1 flex-shrink-0" />
                            <span className="text-muted-foreground">{interaction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Loading comprehensive drug information...</p>
                </div>
              )}
            </Card>

            {/* Detailed Drug Information */}
            <Card className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Microscope className="w-6 h-6 text-primary" />
                Detailed Medical Information
              </h3>

              {analysisResults ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {analysisResults.brand_names?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-primary mb-2">Brand Names</h4>
                        <div className="space-y-1">
                          {analysisResults.brand_names.map((name: string, i: number) => (
                            <Badge key={i} variant="secondary" className="mr-1">
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysisResults.indication && (
                      <div>
                        <h4 className="font-semibold text-success mb-2">Primary Indication</h4>
                        <p className="text-sm text-muted-foreground">{analysisResults.indication}</p>
                      </div>
                    )}

                    {analysisResults.drug_class && (
                      <div>
                        <h4 className="font-semibold text-accent mb-2">Drug Class</h4>
                        <Badge variant="outline">{analysisResults.drug_class}</Badge>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {analysisResults.manufacturer && (
                      <div>
                        <h4 className="font-semibold text-primary mb-2">Manufacturer</h4>
                        <p className="text-sm">{analysisResults.manufacturer}</p>
                      </div>
                    )}

                    {analysisResults.safety_warnings?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-destructive mb-2">Safety Warnings</h4>
                        <ul className="space-y-1">
                          {analysisResults.safety_warnings.slice(0, 3).map((warning: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                              <span>{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Analysis results will appear here when complete.</p>
                </div>
              )}
            </Card>

            {/* Sources & References with Navigation */}
            {analysisResults?.data_sources_with_links?.length > 0 && (
              <Card className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <ExternalLink className="w-6 h-6 text-primary" />
                  Sources & References
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click on any source to access the original research or data.
                </p>
                <div className="space-y-3">
                  {analysisResults.data_sources_with_links.map((source: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-4 glass-panel rounded-lg hover:bg-accent/5 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {source.type}
                          </Badge>
                          <h4 className="font-semibold text-sm">{source.name}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">{source.description}</p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Market Intelligence */}
            {marketData && (
              <Card className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-success" />
                  Market Intelligence
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 glass-panel rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">Active</div>
                    <div className="text-sm text-muted-foreground">Market Status</div>
                  </div>
                  <div className="text-center p-4 glass-panel rounded-lg">
                    <div className="text-2xl font-bold text-success mb-1">High</div>
                    <div className="text-sm text-muted-foreground">Confidence Score</div>
                  </div>
                  <div className="text-center p-4 glass-panel rounded-lg">
                    <div className="text-2xl font-bold text-accent mb-1">Global</div>
                    <div className="text-sm text-muted-foreground">Market Reach</div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        );
      }

      case 'picturize': {
        const drugName = data?.medication || 'Unknown Drug';

        return (
          <div className="space-y-6">
            {/* Picturize Header */}
            <Card className="glass-card p-6 bg-green/5 border-green/20">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Image className="w-8 h-8 text-green-600" />
                Visual Mechanism Illustration
              </h2>
              <p className="text-muted-foreground">
                AI-generated visual illustrations showing how <span className="font-semibold text-foreground">{drugName}</span> affects your body at the molecular level.
              </p>
            </Card>

            {/* Drug Analysis for Image Context */}
            {drugAnalysis && (
              <Card className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-primary" />
                  Mechanism Summary
                </h3>
                <p className="text-muted-foreground mb-4">{drugAnalysis.mechanismOfAction}</p>
              </Card>
            )}

            {/* Image Generation Interface */}
            <PicturizeImageGenerator
              drugName={drugName}
              drugAnalysis={drugAnalysis}
            />

            {/* Educational Notes */}
            <Card className="glass-card p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Understanding the Visuals
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-success mb-2">What You'll See</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Molecular structure of {drugName}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Target receptors and binding sites
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Cellular pathway interactions
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Therapeutic effects visualization
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-blue-600 mb-2">Educational Value</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-blue-600" />
                      Simplified complex biology
                    </li>
                    <li className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-blue-600" />
                      Patient-friendly explanations
                    </li>
                    <li className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-blue-600" />
                      Visual learning support
                    </li>
                    <li className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-blue-600" />
                      Medication adherence improvement
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        );
      }

      case 'research': {
        const drugName = data?.medication || 'Unknown Drug';

        return (
          <div className="space-y-6">
            {/* Executive Summary */}
            {executiveSummary && (
              <Card className="glass-card p-6 bg-primary/5 border-primary/20">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-primary" />
                  Research Summary
                </h3>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p className="whitespace-pre-wrap">{executiveSummary}</p>
                </div>
              </Card>
            )}

            {/* Clinical Trials */}
            <Card className="glass-card p-6">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Brain className="w-6 h-6 text-primary" />
                Clinical Research for {drugName}
              </h3>

              {analysisResults?.clinical_trials?.length > 0 ? (
                <div className="space-y-4">
                  {analysisResults.clinical_trials.map((trial: any, i: number) => (
                    <div key={i} className="glass-panel p-4 rounded-xl">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-2">{trial.title || `Clinical Trial ${i + 1}`}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-muted-foreground">Phase:</span>
                              <Badge variant="secondary" className="ml-2">
                                {trial.phase || 'Not specified'}
                              </Badge>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Status:</span>
                              <Badge
                                variant={trial.status?.toLowerCase().includes('completed') ? 'default' : 'secondary'}
                                className="ml-2"
                              >
                                {trial.status || 'Unknown'}
                              </Badge>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">Sponsor:</span>
                              <span className="ml-2">{trial.sponsor || 'Not specified'}</span>
                            </div>
                          </div>
                          {trial.condition && (
                            <p className="text-sm text-muted-foreground mt-2">
                              <strong>Condition:</strong> {trial.condition}
                            </p>
                          )}
                        </div>
                        {trial.study_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={trial.study_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Clinical trials data will appear here when analysis is complete.</p>
                  {analysisProgress?.status === 'in_progress' && (
                    <p className="text-sm mt-2">Searching clinical trial databases...</p>
                  )}
                </div>
              )}
            </Card>

            {/* Market Research Insights */}
            {analysisResults?.market_trends?.length > 0 && (
              <Card className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-accent" />
                  Market Research Insights
                </h3>
                <div className="space-y-3">
                  {analysisResults.market_trends.map((trend: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      <span className="text-sm">{trend}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Sources & References with Navigation */}
            {analysisResults?.data_sources_with_links?.length > 0 && (
              <Card className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <ExternalLink className="w-6 h-6 text-primary" />
                  Sources & References
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click on any source to access the original research or data.
                </p>
                <div className="space-y-3">
                  {analysisResults.data_sources_with_links.map((source: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-4 glass-panel rounded-lg hover:bg-accent/5 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {source.type}
                          </Badge>
                          <h4 className="font-semibold text-sm">{source.name}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">{source.description}</p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

          </div>
        );
      }

      case 'deep_research': {
        const drugName = data?.medication || 'Unknown Drug';

        return (
          <div className="space-y-6">
            {/* AI-Powered Deep Research Header */}
            <Card className="glass-card p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <div className="flex items-center gap-3 mb-4">
                <Microscope className="w-8 h-8 text-primary" />
                <div>
                  <h2 className="text-2xl font-bold text-primary">Deep Research Analysis</h2>
                  <p className="text-sm text-muted-foreground">Multi-agent AI intelligence with Bright Data</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-primary">Claude Sonnet</div>
                  <div className="text-xs text-muted-foreground">Strategic Analysis</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-accent">NOVA Premier</div>
                  <div className="text-xs text-muted-foreground">Data Processing</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-success">Bright Data</div>
                  <div className="text-xs text-muted-foreground">Market Intelligence</div>
                </div>
              </div>
            </Card>

            {/* Executive Summary */}
            {executiveSummary && (
              <Card className="glass-card p-6 bg-primary/5 border-primary/20">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-primary" />
                  Executive Intelligence Report
                </h3>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p className="whitespace-pre-wrap">{executiveSummary}</p>
                </div>
              </Card>
            )}

            {/* Multi-Agent Analysis Results */}
            {analysisResults && (
              <Card className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-accent" />
                  Multi-Agent Intelligence Findings
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {analysisResults.market_trends?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-primary mb-3">Market Trends & Insights</h4>
                        <div className="space-y-2">
                          {analysisResults.market_trends.slice(0, 5).map((trend: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 p-3 glass-panel rounded-lg">
                              <TrendingUp className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{trend}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {analysisResults.regulatory_updates?.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-accent mb-3">Regulatory Intelligence</h4>
                        <div className="space-y-2">
                          {analysisResults.regulatory_updates.slice(0, 5).map((update: string, i: number) => (
                            <div key={i} className="flex items-start gap-2 p-3 glass-panel rounded-lg">
                              <Shield className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{update}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </Card>
            )}

            {/* Competitor Intelligence */}
            {competitorData?.competitors?.length > 0 && (
              <Card className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary" />
                  Competitive Intelligence
                </h3>
                <div className="space-y-4">
                  {competitorData.competitors.map((competitor: any, i: number) => (
                    <div key={i} className="p-4 glass-panel rounded-xl">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{competitor.competitor_name}</h4>
                          {competitor.market_share && (
                            <p className="text-sm text-muted-foreground">
                              Market Share: {competitor.market_share}%
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          AI Analyzed
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {competitor.strengths?.length > 0 && (
                          <div>
                            <h5 className="font-medium text-success mb-2">Strategic Strengths</h5>
                            <ul className="space-y-1">
                              {competitor.strengths.slice(0, 3).map((strength: string, j: number) => (
                                <li key={j} className="flex items-center gap-2">
                                  <CheckCircle className="w-3 h-3 text-success" />
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {competitor.recent_developments?.length > 0 && (
                          <div>
                            <h5 className="font-medium text-primary mb-2">Recent Developments</h5>
                            <ul className="space-y-1">
                              {competitor.recent_developments.slice(0, 3).map((dev: string, j: number) => (
                                <li key={j} className="flex items-center gap-2">
                                  <TrendingUp className="w-3 h-3 text-primary" />
                                  <span>{dev}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Sources & References with Navigation */}
            {analysisResults?.data_sources_with_links?.length > 0 && (
              <Card className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <ExternalLink className="w-6 h-6 text-primary" />
                  Research Sources & References
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Access the original research sources, clinical trials, and regulatory data that powered this multi-agent analysis.
                </p>
                <div className="space-y-3">
                  {analysisResults.data_sources_with_links.map((source: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-4 glass-panel rounded-lg hover:bg-accent/5 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {source.type}
                          </Badge>
                          <h4 className="font-semibold text-sm">{source.name}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">{source.description}</p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Real-time Market Intelligence */}
            {marketData && (
              <Card className="glass-card p-6 bg-success/5 border-success/20">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-success" />
                  Real-time Market Intelligence
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 glass-panel rounded-lg">
                    <div className="text-2xl font-bold text-success mb-1">Live</div>
                    <div className="text-sm text-muted-foreground">Market Status</div>
                  </div>
                  <div className="text-center p-4 glass-panel rounded-lg">
                    <div className="text-2xl font-bold text-primary mb-1">AI-Powered</div>
                    <div className="text-sm text-muted-foreground">Analysis Engine</div>
                  </div>
                  <div className="text-center p-4 glass-panel rounded-lg">
                    <div className="text-2xl font-bold text-accent mb-1">Multi-Agent</div>
                    <div className="text-sm text-muted-foreground">Intelligence System</div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        );
      }

      case 'competitive':
      case 'market': {
        const drugName = data?.medication || 'Unknown Drug';

        return (
          <div className="space-y-6">
            {/* Executive Summary */}
            {executiveSummary && (
              <Card className="glass-card p-6 bg-primary/5 border-primary/20">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-primary" />
                  Competitive Intelligence Summary
                </h3>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p className="whitespace-pre-wrap">{executiveSummary}</p>
                </div>
              </Card>
            )}

            {/* Competitor Analysis */}
            {competitorData?.competitors?.length > 0 && (
              <Card className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-accent" />
                  Competitive Landscape
                </h3>
                <div className="space-y-4">
                  {competitorData.competitors.map((competitor: any, i: number) => (
                    <div key={i} className="glass-panel p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{competitor.competitor_name}</h4>
                          {competitor.market_share && (
                            <p className="text-sm text-muted-foreground">
                              Market Share: {competitor.market_share}%
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {competitor.strengths?.length > 0 && (
                          <div>
                            <h5 className="font-medium text-success mb-2">Strengths</h5>
                            <ul className="space-y-1">
                              {competitor.strengths.slice(0, 3).map((strength: string, j: number) => (
                                <li key={j} className="flex items-center gap-2">
                                  <CheckCircle className="w-3 h-3 text-success" />
                                  <span>{strength}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {competitor.weaknesses?.length > 0 && (
                          <div>
                            <h5 className="font-medium text-warning mb-2">Weaknesses</h5>
                            <ul className="space-y-1">
                              {competitor.weaknesses.slice(0, 3).map((weakness: string, j: number) => (
                                <li key={j} className="flex items-center gap-2">
                                  <AlertTriangle className="w-3 h-3 text-warning" />
                                  <span>{weakness}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {competitor.key_products?.length > 0 && (
                        <div className="mt-3">
                          <h5 className="font-medium mb-2">Key Products</h5>
                          <div className="flex flex-wrap gap-2">
                            {competitor.key_products.map((product: string, j: number) => (
                              <Badge key={j} variant="outline" className="text-xs">
                                {product}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Pricing Analysis */}
            {pricingData && (
              <Card className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-success" />
                  Pricing Intelligence
                </h3>

                {pricingData.regional_pricing && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {Object.entries(pricingData.regional_pricing).map(([region, data]: [string, any]) => (
                      <div key={region} className="glass-panel p-4 rounded-lg text-center">
                        <h4 className="font-semibold mb-2">{region}</h4>
                        <div className="text-2xl font-bold text-primary mb-1">
                          {data.average_price || 'N/A'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {data.market_access_status || 'Status Unknown'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {pricingData.price_trends && (
                  <div className="glass-panel p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Price Trends</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">12-Month Change:</span>
                        <span className="ml-2 text-success">{pricingData.price_trends.price_change_12m}</span>
                      </div>
                      <div>
                        <span className="font-medium">Trend Direction:</span>
                        <Badge variant="secondary" className="ml-2">
                          {pricingData.price_trends.trend_direction}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* SWOT Analysis */}
            {analysisResults?.swot_analysis && (
              <Card className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-primary" />
                  SWOT Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-success mb-2">Strengths</h4>
                      <ul className="space-y-1 text-sm">
                        {analysisResults.swot_analysis.strengths?.map((item: string, i: number) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-success" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-accent mb-2">Opportunities</h4>
                      <ul className="space-y-1 text-sm">
                        {analysisResults.swot_analysis.opportunities?.map((item: string, i: number) => (
                          <li key={i} className="flex items-center gap-2">
                            <TrendingUp className="w-3 h-3 text-accent" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-warning mb-2">Weaknesses</h4>
                      <ul className="space-y-1 text-sm">
                        {analysisResults.swot_analysis.weaknesses?.map((item: string, i: number) => (
                          <li key={i} className="flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3 text-warning" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-destructive mb-2">Threats</h4>
                      <ul className="space-y-1 text-sm">
                        {analysisResults.swot_analysis.threats?.map((item: string, i: number) => (
                          <li key={i} className="flex items-center gap-2">
                            <Shield className="w-3 h-3 text-destructive" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        );
      }

      default:
        return (
          <div className="space-y-6">
            <Card className="glass-card p-6">
              <h3 className="text-2xl font-bold mb-4 capitalize flex items-center gap-2">
                <Brain className="w-6 h-6 text-primary" />
                {action} Analysis
              </h3>

              {analysisResults ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Comprehensive {action} analysis completed for {data?.medication || 'your medication'}.
                  </p>
                  {executiveSummary && (
                    <div className="glass-panel p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">AI Summary</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {executiveSummary}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Analysis results will appear here when processing is complete.</p>
                  {analysisProgress?.status === 'in_progress' && (
                    <p className="text-sm mt-2">Processing {action} analysis...</p>
                  )}
                </div>
              )}
            </Card>
          </div>
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