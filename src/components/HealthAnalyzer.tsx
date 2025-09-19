import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Mic,
  MicOff,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Brain,
  Stethoscope,
  FileText,
  Zap,
  Heart,
  Activity,
  Clock,
  Shield,
  Save,
  History,
  Calendar,
  Trash2,
  Plus,
  Pill,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';
import SymptomReportSummary from '@/components/SymptomReportSummary';
import { createGladiaService } from '@/lib/api/gladiaService';
import { createHealthAnalysisService, type HealthAnalysisResult } from '@/lib/api/healthAnalysisService';
import { sessionCacheService, type UserPreferences } from '@/lib/services/sessionCacheService';
import { useRedis } from '@/hooks/useRedis';

// Symptom entry interface for tracking
interface SymptomEntry {
  id: string;
  concern: string;
  symptoms: string;
  timestamp: Date;
  severity?: 'mild' | 'moderate' | 'severe';
  autoSaved: boolean;
}

interface HealthAnalyzerProps {
  onAnalysisComplete?: (result: HealthAnalysisResult) => void;
}

const HealthAnalyzer: React.FC<HealthAnalyzerProps> = ({ onAnalysisComplete }) => {
  const [concern, setConcern] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<HealthAnalysisResult | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [symptomEntries, setSymptomEntries] = useState<SymptomEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [severity, setSeverity] = useState<'mild' | 'moderate' | 'severe'>('mild');
  const [showConcernDropdown, setShowConcernDropdown] = useState(false);
  const [filteredConcerns, setFilteredConcerns] = useState<string[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [showReportSummary, setShowReportSummary] = useState(false);
  const [loadedEntryId, setLoadedEntryId] = useState<string | null>(null);

  const {
    isConnected: isRedisConnected,
    isLoading: isRedisLoading,
    error: redisError,
    saveSymptom,
    getSymptoms,
    deleteSymptom,
    clearAllData,
    getStorageStats,
  } = useRedis({ userId: 'current_user', autoConnect: true });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const gladiaService = useRef(createGladiaService());
  const healthAnalysisService = useRef(createHealthAnalysisService());
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Common medical concerns for autocomplete
  const commonConcerns = [
    'Headache', 'Migraine', 'Tension headache', 'Cluster headache',
    'Fever', 'High fever', 'Low-grade fever', 'Chills',
    'Nausea', 'Vomiting', 'Morning sickness', 'Motion sickness',
    'Diarrhea', 'Constipation', 'Stomach pain', 'Abdominal pain',
    'Gastritis', 'Acid reflux', 'Heartburn', 'Indigestion',
    'Cough', 'Dry cough', 'Persistent cough', 'Productive cough',
    'Sore throat', 'Throat pain', 'Difficulty swallowing',
    'Runny nose', 'Stuffy nose', 'Nasal congestion', 'Sinusitis',
    'Back pain', 'Lower back pain', 'Upper back pain', 'Neck pain',
    'Joint pain', 'Knee pain', 'Shoulder pain', 'Hip pain',
    'Muscle pain', 'Muscle cramps', 'Muscle weakness',
    'Chest pain', 'Shortness of breath', 'Difficulty breathing',
    'Dizziness', 'Lightheadedness', 'Vertigo', 'Balance problems',
    'Fatigue', 'Tiredness', 'Weakness', 'Exhaustion',
    'Insomnia', 'Sleep problems', 'Difficulty falling asleep',
    'Anxiety', 'Stress', 'Depression', 'Mood changes',
    'Skin rash', 'Itching', 'Dry skin', 'Acne', 'Eczema',
    'Allergies', 'Seasonal allergies', 'Food allergies',
    'Hypertension', 'High blood pressure', 'Low blood pressure',
    'Diabetes', 'High blood sugar', 'Low blood sugar',
    'Urinary tract infection', 'Frequent urination', 'Painful urination',
    'Menstrual cramps', 'Irregular periods', 'Heavy bleeding',
    'Cold symptoms', 'Flu symptoms', 'COVID symptoms',
    'Ear pain', 'Hearing problems', 'Tinnitus',
    'Eye pain', 'Blurred vision', 'Dry eyes', 'Eye strain',
    'Toothache', 'Dental pain', 'Gum pain', 'Jaw pain'
  ];

  // Initialize session and load user preferences
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const sessionData = sessionCacheService.getSessionData();
        if (sessionData?.preferences) {
          setUserPreferences(sessionData.preferences);
          console.log('📦 User preferences loaded from session:', sessionData.preferences);
        }

        // Clear any cached symptoms to prevent auto-population
        localStorage.removeItem('health_analyzer_draft');
        console.log('🧹 Cleared cached draft data to prevent auto-population');
      } catch (error) {
        console.warn('Session initialization failed:', error);
      }
    };

    initializeSession();
  }, []);

  // Disabled auto-save to prevent unwanted auto-population
  // useEffect(() => {
  //   if (concern.trim() || symptoms.trim()) {
  //     const draftData = { concern, symptoms, timestamp: new Date().toISOString() };
  //     localStorage.setItem('health_analyzer_draft', JSON.stringify(draftData));
  //   }
  // }, [concern, symptoms]);

  // Filter concerns based on user input
  const handleConcernChange = (value: string) => {
    setConcern(value);
    
    if (value.length > 0) {
      const filtered = commonConcerns.filter(concern =>
        concern.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8); // Show max 8 suggestions
      setFilteredConcerns(filtered);
      setShowConcernDropdown(filtered.length > 0);
    } else {
      setShowConcernDropdown(false);
      setFilteredConcerns([]);
    }
  };

  // Select concern from dropdown
  const selectConcern = (selectedConcern: string) => {
    setConcern(selectedConcern);
    setShowConcernDropdown(false);
    setFilteredConcerns([]);
  };

  // Medication database with detailed information
  const medicationDatabase: Record<string, {
    name: string;
    genericName?: string;
    class: string;
    uses: string[];
    conditions: string[];
    commonSideEffects: string[];
    description: string;
  }> = {
    'metoprolol': {
      name: 'Metoprolol',
      genericName: 'Metoprolol Tartrate/Succinate',
      class: 'Beta-blocker (Selective β1-adrenergic antagonist)',
      uses: [
        'High blood pressure (hypertension)',
        'Chest pain (angina)',
        'Heart failure',
        'Heart attack prevention',
        'Irregular heartbeat (arrhythmia)'
      ],
      conditions: [
        'Hypertension',
        'Coronary artery disease',
        'Heart failure with reduced ejection fraction',
        'Post-myocardial infarction',
        'Atrial fibrillation rate control'
      ],
      commonSideEffects: [
        'Dizziness or lightheadedness',
        'Fatigue or tiredness',
        'Slow heart rate (bradycardia)',
        'Cold hands and feet',
        'Shortness of breath'
      ],
      description: 'A selective beta-1 blocker that works by blocking the action of certain natural chemicals in your body, such as epinephrine, on the heart and blood vessels. This effect lowers heart rate, blood pressure, and strain on the heart.'
    },
    'metoprolol succinate': {
      name: 'Metoprolol Succinate',
      genericName: 'Metoprolol Succinate Extended-Release',
      class: 'Beta-blocker (Extended-Release)',
      uses: [
        'High blood pressure (hypertension)',
        'Heart failure',
        'Long-term heart protection',
        'Chronic angina prevention'
      ],
      conditions: [
        'Hypertension',
        'Heart failure with reduced ejection fraction',
        'Coronary artery disease',
        'Post-myocardial infarction long-term therapy'
      ],
      commonSideEffects: [
        'Dizziness or lightheadedness',
        'Fatigue or tiredness',
        'Slow heart rate',
        'Depression or mood changes',
        'Difficulty sleeping'
      ],
      description: 'An extended-release formulation of metoprolol that provides 24-hour blood pressure control with once-daily dosing. It\'s specifically designed for sustained cardiovascular protection.'
    },
    'lisinopril': {
      name: 'Lisinopril',
      class: 'ACE Inhibitor',
      uses: [
        'High blood pressure',
        'Heart failure',
        'Kidney protection in diabetes',
        'Post-heart attack treatment'
      ],
      conditions: [
        'Hypertension',
        'Heart failure',
        'Diabetic nephropathy',
        'Post-myocardial infarction'
      ],
      commonSideEffects: [
        'Dry cough',
        'Dizziness',
        'Headache',
        'Fatigue',
        'Nausea'
      ],
      description: 'An ACE inhibitor that relaxes blood vessels by blocking the formation of angiotensin II, helping to lower blood pressure and reduce strain on the heart.'
    },
    'amlodipine': {
      name: 'Amlodipine',
      class: 'Calcium Channel Blocker',
      uses: [
        'High blood pressure',
        'Chest pain (angina)',
        'Coronary artery disease'
      ],
      conditions: [
        'Hypertension',
        'Chronic stable angina',
        'Vasospastic angina'
      ],
      commonSideEffects: [
        'Swelling in ankles/feet',
        'Dizziness',
        'Flushing',
        'Fatigue',
        'Palpitations'
      ],
      description: 'A calcium channel blocker that works by relaxing blood vessels and improving blood flow, reducing blood pressure and chest pain.'
    },
    'metaprolol': {
      name: 'Metoprolol (Alternative Spelling)',
      genericName: 'Metoprolol Tartrate/Succinate',
      class: 'Beta-blocker (Selective β1-adrenergic antagonist)',
      uses: [
        'High blood pressure (hypertension)',
        'Chest pain (angina)',
        'Heart failure',
        'Heart attack prevention',
        'Irregular heartbeat (arrhythmia)'
      ],
      conditions: [
        'Hypertension',
        'Coronary artery disease',
        'Heart failure with reduced ejection fraction',
        'Post-myocardial infarction',
        'Atrial fibrillation rate control'
      ],
      commonSideEffects: [
        'Dizziness or lightheadedness',
        'Fatigue or tiredness',
        'Slow heart rate (bradycardia)',
        'Cold hands and feet',
        'Shortness of breath'
      ],
      description: 'A selective beta-1 blocker that works by blocking the action of certain natural chemicals in your body, such as epinephrine, on the heart and blood vessels. This effect lowers heart rate, blood pressure, and strain on the heart.'
    },
    'metaprolol succinate': {
      name: 'Metoprolol Succinate (Alternative Spelling)',
      genericName: 'Metoprolol Succinate Extended-Release',
      class: 'Beta-blocker (Extended-Release)',
      uses: [
        'High blood pressure (hypertension)',
        'Heart failure',
        'Long-term heart protection',
        'Chronic angina prevention'
      ],
      conditions: [
        'Hypertension',
        'Heart failure with reduced ejection fraction',
        'Coronary artery disease',
        'Post-myocardial infarction long-term therapy'
      ],
      commonSideEffects: [
        'Dizziness or lightheadedness',
        'Fatigue or tiredness',
        'Slow heart rate',
        'Depression or mood changes',
        'Difficulty sleeping'
      ],
      description: 'An extended-release formulation of metoprolol that provides 24-hour blood pressure control with once-daily dosing. It\'s specifically designed for sustained cardiovascular protection.'
    }
    // Add more medications as needed
  };

  // Function to detect medications in text
  const detectMedications = (text: string): Array<{medication: string, info: typeof medicationDatabase[string]}> => {
    const detectedMeds: Array<{medication: string, info: typeof medicationDatabase[string]}> = [];
    const lowerText = text.toLowerCase();
    
    console.log('Detecting medications in text:', text);
    console.log('Lowercase text:', lowerText);
    console.log('Available medications:', Object.keys(medicationDatabase));
    
    Object.keys(medicationDatabase).forEach(medName => {
      const medNameLower = medName.toLowerCase();
      console.log(`Checking if "${lowerText}" includes "${medNameLower}":`, lowerText.includes(medNameLower));
      
      if (lowerText.includes(medNameLower)) {
        console.log('Found medication:', medName);
        detectedMeds.push({
          medication: medName,
          info: medicationDatabase[medName]
        });
      }
    });
    
    console.log('Detected medications:', detectedMeds);
    return detectedMeds;
  };

  // Enhanced health analysis that includes medication context
  const enhanceAnalysisWithMedications = (baseAnalysis: HealthAnalysisResult, medications: Array<{medication: string, info: typeof medicationDatabase[string]}>) => {
    if (medications.length === 0) return baseAnalysis;

    const medInfo = medications[0].info; // Use first detected medication
    
    // Enhanced recommendation that considers the medication
    const enhancedRecommendation = `${baseAnalysis.recommendation}\n\nSince you're taking ${medInfo.name} (${medInfo.class}), it's important to monitor for potential side effects such as ${medInfo.commonSideEffects.slice(0, 2).join(' and ')}. If you're experiencing dizziness or fatigue, this could be related to your medication. Consult your healthcare provider if symptoms persist or worsen, as dosage adjustments may be needed.`;

    return {
      ...baseAnalysis,
      recommendation: enhancedRecommendation,
      detectedMedications: medications
    };
  };

  // Load saved entries from Redis on component mount
  useEffect(() => {
    const loadSymptomEntries = async () => {
      try {
        const entries = await getSymptoms();
        setSymptomEntries(entries);
      } catch (error) {
        console.error('Failed to load saved entries from Redis:', error);
      }
    };

    if (isRedisConnected) {
      loadSymptomEntries();
    }
  }, [isRedisConnected, getSymptoms]);

  // Auto-save functionality - now saves to Redis after analysis
  const saveCompleteEntry = async () => {
    if (concern.trim() && symptoms.trim()) {
      const success = await saveSymptom({
        concern: concern.trim(),
        symptoms: symptoms.trim(),
        timestamp: new Date(),
        severity,
        autoSaved: false // Mark as complete entry, not auto-saved
      });

      if (success) {
        // Refresh the entries list
        const updatedEntries = await getSymptoms();
        setSymptomEntries(updatedEntries);
        setLastSaved(new Date());
      }
    }
  };

  // Remove the auto-save effect - we'll only save after analysis
  // useEffect(() => {
  //   // Auto-save logic removed to prevent redundant entries
  // }, [concern, symptoms, severity]);

  // Manual save function - now saves to Redis
  const manualSave = async () => {
    if (concern.trim() && symptoms.trim()) {
      const success = await saveSymptom({
        concern: concern.trim(),
        symptoms: symptoms.trim(),
        timestamp: new Date(),
        severity,
        autoSaved: false
      });

      if (success) {
        // Refresh the entries list
        const updatedEntries = await getSymptoms();
        setSymptomEntries(updatedEntries);
        setLastSaved(new Date());
      }
    }
  };

  // Delete entry from Redis
  const deleteEntry = async (id: string) => {
    const success = await deleteSymptom(id);
    if (success) {
      // Refresh the entries list
      const updatedEntries = await getSymptoms();
      setSymptomEntries(updatedEntries);
    }
  };

  // Load entry into form
  const loadEntry = (entry: SymptomEntry) => {
    setConcern(entry.concern);
    setSymptoms(entry.symptoms);
    setSeverity(entry.severity || 'mild');
    setLoadedEntryId(entry.id);
    // Keep history section open so user can see the loaded entry
    // setShowHistory(false); // Commented out to keep history visible
    
    // Clear any existing analysis result since we're loading a different entry
    setAnalysisResult(null);
    
    // Scroll to the form section to show the loaded data
    setTimeout(() => {
      const formSection = document.querySelector('[data-form-section]');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Clear current form
  const clearForm = () => {
    setConcern('');
    setSymptoms('');
    setSeverity('mild');
    setAnalysisResult(null);
    setLoadedEntryId(null);
  };

  // Clear all history entries from Redis
  const clearAllHistory = async () => {
    const success = await clearAllData();
    if (success) {
      setSymptomEntries([]);
      setLastSaved(null);
    }
  };

  // Health analysis using the service
  const analyzeHealthConcern = async (concern: string, symptoms: string): Promise<HealthAnalysisResult> => {
    return await healthAnalysisService.current.analyzeHealthConcern({
      concern,
      symptoms
    });
  };

  const startRecording = async () => {
    try {
      setRecordingError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });

        // Transcribe using Gladia API
        setIsTranscribing(true);
        try {
          const result = await gladiaService.current.transcribeAudio(audioBlob);
          if (result.transcription) {
            setSymptoms(prev => prev + (prev ? ' ' : '') + result.transcription);
          }
        } catch (error) {
          console.error('Transcription failed:', error);
          setRecordingError('Transcription failed. Please try again or type your symptoms.');
        } finally {
          setIsTranscribing(false);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      setRecordingError('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleGenerate = async () => {
    if (!concern.trim() || !symptoms.trim()) {
      return;
    }

    setIsGenerating(true);
    try {
      // Start analysis tracking with session cache
      const analysisId = await sessionCacheService.startAnalysis(`health_analysis_${concern.slice(0, 20)}`);

      // Update analysis progress - step 1: Processing input
      await sessionCacheService.updateAnalysisProgress(analysisId, 'upload', 10);

      // Check for cached analysis result first
      const cacheKey = `${concern.toLowerCase()}_${symptoms.toLowerCase()}`.replace(/[^a-z0-9_]/g, '_');
      const cachedResult = await sessionCacheService.getCachedAnalysisResult(cacheKey);

      if (cachedResult && userPreferences?.autoSaveResults !== false) {
        console.log('📦 Using cached health analysis result');
        setAnalysisResult(cachedResult.results);
        onAnalysisComplete?.(cachedResult.results);
        await sessionCacheService.updateAnalysisProgress(analysisId, 'complete', 100);

        // Save to history
        saveCompleteEntry();

        // Clear draft since analysis is complete
        localStorage.removeItem('health_analyzer_draft');
        return;
      }

      // Update progress - step 2: Analyzing medications
      await sessionCacheService.updateAnalysisProgress(analysisId, 'ocr', 30);

      // Detect medications in both concern and symptoms text
      const allText = `${concern} ${symptoms}`;
      const detectedMedications = detectMedications(allText);

      // Update progress - step 3: Generating analysis
      await sessionCacheService.updateAnalysisProgress(analysisId, 'analysis', 60);

      // Get base analysis
      const baseResult = await analyzeHealthConcern(concern, symptoms);

      // Update progress - step 4: Enhancing with medication context
      await sessionCacheService.updateAnalysisProgress(analysisId, 'analysis', 80);

      // Enhance analysis with medication context
      const enhancedResult = enhanceAnalysisWithMedications(baseResult, detectedMedications);

      // Update progress - step 5: Finalizing results
      await sessionCacheService.updateAnalysisProgress(analysisId, 'results', 95);

      setAnalysisResult(enhancedResult);
      onAnalysisComplete?.(enhancedResult);

      // Cache the analysis result for future use
      await sessionCacheService.cacheAnalysisResult(
        cacheKey,
        enhancedResult,
        enhancedResult.condition,
        enhancedResult.recommendation
      );

      // Complete analysis tracking
      await sessionCacheService.updateAnalysisProgress(analysisId, 'complete', 100);

      // Save complete entry to history only after successful analysis
      saveCompleteEntry();

      // Clear draft since analysis is complete
      localStorage.removeItem('health_analyzer_draft');

    } catch (error) {
      console.error('Analysis failed:', error);

      // Update analysis progress with error state
      console.log('Analysis failed, error logged');
    } finally {
      setIsGenerating(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'mild': return <CheckCircle className="w-4 h-4" />;
      case 'moderate': return <Clock className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  // Update user preferences with session caching
  const updateUserPreferences = async (newPreferences: Partial<UserPreferences>) => {
    try {
      await sessionCacheService.updatePreferences(newPreferences);
      setUserPreferences(prev => ({ ...prev, ...newPreferences } as UserPreferences));
      console.log('✅ User preferences updated:', newPreferences);
    } catch (error) {
      console.warn('Failed to update user preferences:', error);
    }
  };

  // Extend session on user activity
  const extendSession = () => {
    sessionCacheService.extendSession().catch(console.warn);
  };

  return (
    <div className="space-y-8">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Symptom & Concern Tracker</h2>
          <p className="text-sm text-muted-foreground">
            Track your symptoms with complete entry saving and timestamp tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Redis Connection Status */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-800/30 border border-stone-700/30">
            {isRedisConnected ? (
              <>
                <Database className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400">Redis</span>
              </>
            ) : (
              <>
                <Database className="w-3 h-3 text-orange-400" />
                <span className="text-xs text-orange-400">Local</span>
              </>
            )}
          </div>
          
          <Button
            onClick={() => setShowHistory(!showHistory)}
            variant="outline"
            size="sm"
            className="rounded-xl shadow-lg"
          >
            <History className="w-4 h-4 mr-2" />
            History ({symptomEntries.length})
          </Button>
          <Button
            onClick={clearForm}
            variant="outline"
            size="sm"
            className="rounded-xl shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </Button>
        </div>
      </div>

      {/* Save Status */}
      {lastSaved && (
        <div className="flex items-center gap-2 text-sm text-white/80 bg-white/5 backdrop-blur-xl border border-white/10 p-3 rounded-xl shadow-lg">
          <Save className="w-4 h-4 text-orange-500" />
          <span>Last saved at {lastSaved.toLocaleTimeString()}</span>
        </div>
      )}

      {/* Loaded Entry Status */}
      {loadedEntryId && (
        <div className="flex items-center gap-2 text-sm text-white/80 bg-orange-900/20 backdrop-blur-xl border border-orange-500/30 p-3 rounded-xl shadow-lg">
          <CheckCircle className="w-4 h-4 text-orange-400" />
          <span>Entry loaded from history - you can now edit or analyze these symptoms</span>
          <Button
            onClick={clearForm}
            variant="ghost"
            size="sm"
            className="ml-auto text-orange-300 hover:text-white hover:bg-orange-500/20 h-6 px-2 rounded-lg"
          >
            Clear
          </Button>
        </div>
      )}

      {/* History Section */}
      {showHistory && (
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Symptom History</h3>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500">{symptomEntries.length} entries</Badge>
              {symptomEntries.length > 0 && (
                <>
                  <Button
                    onClick={() => setShowReportSummary(true)}
                    variant="default"
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-lg"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    Summarize Symptom Report
                  </Button>
                  <Button
                    onClick={clearAllHistory}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-white hover:bg-red-500 rounded-xl shadow-lg border-red-300 bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Clear All
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {symptomEntries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No symptom entries yet. Start tracking your symptoms above.
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {symptomEntries.map((entry) => (
                <div 
                  key={entry.id} 
                  className={`border rounded-xl p-4 transition-colors ${
                    loadedEntryId === entry.id 
                      ? 'bg-orange-900/20 border-orange-500/30 shadow-lg backdrop-blur-sm' 
                      : 'bg-stone-800/30 border-stone-700/30 hover:bg-stone-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={entry.severity === 'severe' ? 'destructive' : entry.severity === 'moderate' ? 'default' : 'secondary'}>
                          {entry.severity}
                        </Badge>
                        <span className="text-sm text-white/60 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {entry.timestamp.toLocaleDateString()} at {entry.timestamp.toLocaleTimeString()}
                        </span>
                        {entry.autoSaved && (
                          <Badge variant="outline" className="text-xs text-white/70 border-white/30">Auto-saved</Badge>
                        )}
                        {loadedEntryId === entry.id && (
                          <Badge variant="outline" className="text-xs bg-orange-500/20 text-orange-300 border-orange-500/40">
                            Currently Loaded
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        {entry.concern && (
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-sm text-white/80 min-w-fit">Concern:</span>
                            <span className="text-sm text-white">{entry.concern}</span>
                          </div>
                        )}
                        {entry.symptoms && (
                          <div className="flex items-start gap-2">
                            <span className="font-medium text-sm text-white/80 min-w-fit">Symptoms:</span>
                            <span className="text-sm text-white whitespace-pre-wrap leading-relaxed">{entry.symptoms}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() => loadEntry(entry)}
                        variant={loadedEntryId === entry.id ? "default" : "outline"}
                        size="sm"
                        className={loadedEntryId === entry.id ? "bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg" : "rounded-xl shadow-lg"}
                      >
                        {loadedEntryId === entry.id ? "Loaded" : "Load"}
                      </Button>
                      <Button
                        onClick={() => deleteEntry(entry.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-white hover:bg-red-500 rounded-xl shadow-lg border-red-300 bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-form-section>
        {/* Concern */}
        <Card className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-red-500" />
            <h3 className="text-xl font-bold">Primary Concern</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            What is your main health concern? (e.g., gastritis, headache, fever)
          </p>
          <div className="relative">
            <Input
              placeholder="Enter your primary health concern..."
              value={concern}
              onChange={(e) => handleConcernChange(e.target.value)}
              onFocus={() => {
                if (concern.length > 0 && filteredConcerns.length > 0) {
                  setShowConcernDropdown(true);
                }
              }}
              onBlur={() => {
                // Delay hiding dropdown to allow clicking on suggestions
                setTimeout(() => setShowConcernDropdown(false), 150);
              }}
              className="w-full"
            />
            
            {/* Autocomplete Dropdown - Premium Style */}
            {showConcernDropdown && filteredConcerns.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-stone-800/95 backdrop-blur-xl border border-stone-700/70 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                {filteredConcerns.map((concernOption, index) => (
                  <button
                    key={index}
                    onClick={() => selectConcern(concernOption)}
                    className="w-full text-left px-4 py-3 hover:bg-stone-700/50 focus:bg-stone-700/50 focus:outline-none text-sm border-b border-stone-700/30 last:border-b-0 text-white/90 hover:text-white transition-all duration-200"
                  >
                    <span className="font-medium">{concernOption}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Symptoms */}
        <Card className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Stethoscope className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-bold">Symptom Tracker</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Describe how you're feeling. You can type or use voice input.
          </p>

          <div className="space-y-3">
            <Textarea
              placeholder="Describe your symptoms in detail..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="min-h-[100px] resize-none"
            />

            {/* Severity Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Severity:</span>
              <div className="flex gap-2">
                {(['mild', 'moderate', 'severe'] as const).map((level) => (
                  <Button
                    key={level}
                    onClick={() => setSeverity(level)}
                    variant={severity === level ? "default" : "outline"}
                    size="sm"
                    className={`capitalize rounded-xl shadow-lg transition-all duration-300 ${
                      severity === level
                        ? level === 'severe'
                          ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                          : level === 'moderate'
                          ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
                          : 'bg-green-400 text-white border-green-400 hover:bg-green-500'
                        : level === 'severe'
                          ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-500 hover:text-white'
                          : level === 'moderate'
                          ? 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-500 hover:text-white'
                          : 'bg-green-50 text-green-700 border-green-300 hover:bg-green-400 hover:text-white'
                    }`}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                disabled={isGenerating || isTranscribing}
                className="rounded-xl shadow-lg"
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    Stop Recording
                  </>
                ) : isTranscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Voice Input
                  </>
                )}
              </Button>

              <Button
                onClick={manualSave}
                variant="outline"
                size="sm"
                disabled={!concern.trim() || !symptoms.trim()}
                className="rounded-xl shadow-lg"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Entry
              </Button>

              {isRecording && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Recording...
                </div>
              )}

              {isTranscribing && !isRecording && (
                <div className="flex items-center gap-2 text-blue-600 text-sm">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Processing audio...
                </div>
              )}
            </div>

            {recordingError && (
              <p className="text-sm text-red-600">{recordingError}</p>
            )}
          </div>
        </Card>
      </div>

      {/* Generate Button */}
      <div className="text-center">
        <Button
          onClick={handleGenerate}
          disabled={!concern.trim() || !symptoms.trim() || isGenerating}
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Analyzing Health Condition...
            </>
          ) : (
            <>
              <Brain className="w-5 h-5 mr-2" />
              Generate Health Analysis
            </>
          )}
        </Button>
      </div>

      {/* Summary Results */}
      {analysisResult && (
        <Card className="glass-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-bold">Health Analysis Summary</h3>
          </div>

          <div className="space-y-6">
            {/* Condition & Severity */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-primary mb-2">Condition Identified</h4>
                <p className="text-lg">{analysisResult.condition}</p>
              </div>

              <Badge className={`px-3 py-1 font-medium flex items-center gap-2 ${getSeverityColor(analysisResult.severity)}`}>
                {getSeverityIcon(analysisResult.severity)}
                {analysisResult.severity.charAt(0).toUpperCase() + analysisResult.severity.slice(1)}
              </Badge>
            </div>

            {/* Medications Used, If Any */}
            {analysisResult.detectedMedications && analysisResult.detectedMedications.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-blue-600 mb-3 flex items-center gap-2">
                  <Pill className="w-5 h-5" />
                  Medications Used, If Any
                </h4>
                <div className="space-y-4">
                  {analysisResult.detectedMedications.map((med, index) => (
                    <div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="mb-3">
                        <h5 className="font-semibold text-blue-800 text-lg">{med.info.name}</h5>
                        {med.info.genericName && (
                          <p className="text-sm text-blue-600">Generic: {med.info.genericName}</p>
                        )}
                        <p className="text-sm text-blue-600 font-medium">{med.info.class}</p>
                      </div>
                      
                      <p className="text-sm text-blue-700 mb-3">{med.info.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h6 className="font-medium text-blue-800 mb-2">Common Uses:</h6>
                          <ul className="text-sm text-blue-700 space-y-1">
                            {med.info.uses.slice(0, 3).map((use, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <CheckCircle className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                                {use}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h6 className="font-medium text-blue-800 mb-2">Treats Conditions:</h6>
                          <ul className="text-sm text-blue-700 space-y-1">
                            {med.info.conditions.slice(0, 3).map((condition, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <Heart className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
                                {condition}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <h6 className="font-medium text-orange-700 mb-2">Common Side Effects to Monitor:</h6>
                        <div className="flex flex-wrap gap-2">
                          {med.info.commonSideEffects.slice(0, 4).map((effect, i) => (
                            <Badge key={i} variant="outline" className="text-xs text-orange-700 border-orange-300">
                              {effect}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation */}
            <div>
              <h4 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Why These Symptoms Occur
              </h4>
              <p className="text-muted-foreground leading-relaxed">
                {analysisResult.explanation}
              </p>
            </div>

            {/* Natural Remedies */}
            <div>
              <h4 className="text-lg font-semibold text-green-600 mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Evidence-Based Natural Remedies
              </h4>
              <ul className="space-y-2">
                {analysisResult.naturalRemedies.map((remedy, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{remedy}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendation */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-700 mb-2">General Recommendation</h4>
              <p className="text-blue-700 text-sm">{analysisResult.recommendation}</p>
            </div>

            {/* When to See Doctor */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h4 className="text-lg font-semibold text-orange-700 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Consult a Healthcare Provider If:
              </h4>
              <ul className="space-y-1">
                {analysisResult.whenToSeeDoctor.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-orange-700">{warning}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Medical Disclaimer */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
              <p className="text-xs text-gray-600">
                <strong>Medical Disclaimer:</strong> This analysis is for informational purposes only and does not replace professional medical advice, diagnosis, or treatment. Always consult your healthcare provider for medical concerns.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Symptom Report Summary Dialog */}
      <SymptomReportSummary
        entries={symptomEntries}
        isOpen={showReportSummary}
        onClose={() => setShowReportSummary(false)}
      />
    </div>
  );
};

export default HealthAnalyzer;