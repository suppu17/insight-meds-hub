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
  Shield
} from 'lucide-react';
import { createGladiaService } from '@/lib/api/gladiaService';
import { createHealthAnalysisService, type HealthAnalysisResult } from '@/lib/api/healthAnalysisService';

// Remove duplicate interface - using the one from healthAnalysisService

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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const gladiaService = useRef(createGladiaService());
  const healthAnalysisService = useRef(createHealthAnalysisService());

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
      const result = await analyzeHealthConcern(concern, symptoms);
      setAnalysisResult(result);
      onAnalysisComplete?.(result);
    } catch (error) {
      console.error('Analysis failed:', error);
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

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Concern */}
        <Card className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-red-500" />
            <h3 className="text-xl font-bold">Primary Concern</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            What is your main health concern? (e.g., gastritis, headache, fever)
          </p>
          <Input
            placeholder="Enter your primary health concern..."
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
            className="w-full"
          />
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

            <div className="flex items-center gap-2">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                disabled={isGenerating || isTranscribing}
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
          className="bg-gradient-primary hover:bg-gradient-primary/90 text-white px-8 py-3 text-lg font-semibold"
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
    </div>
  );
};

export default HealthAnalyzer;