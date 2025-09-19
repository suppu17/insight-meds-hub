import { useState, useCallback } from "react";
import { Upload, FileText, Eye, Loader2, Image, CheckCircle, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MedicationInfo {
  name: string;
  dosage?: string;
  frequency?: string;
  instructions?: string;
  strength?: string;
}

interface PatientInfo {
  name?: string;
  dob?: string;
  prescriber?: string;
  pharmacy?: string;
  date?: string;
}

interface ClaudeVisionAnalysis {
  success: boolean;
  timestamp: string;
  image_info: {
    filename: string;
    size_bytes: number;
    mime_type: string;
  };
  analysis_method: string;
  ai_model: string;
  confidence: number;
  extracted_data: {
    medications: MedicationInfo[];
    symptoms: string[];
    allergies: string[];
    medical_notes: string[];
    warnings: string[];
    patient_info?: PatientInfo;
    extracted_text: string;
  };
  summary: {
    medication_count: number;
    primary_medication?: string;
    has_patient_info: boolean;
    analysis_confidence: number;
  };
  image_preview?: {
    base64_data: string;
    display_url: string;
    thumbnail: string;
  };
}

interface ClaudeVisionUploadProps {
  onAnalysisComplete: (analysis: ClaudeVisionAnalysis) => void;
  onMedicationSelect: (medication: string) => void;
}

const ClaudeVisionUpload = ({ onAnalysisComplete, onMedicationSelect }: ClaudeVisionUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ClaudeVisionAnalysis | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files[0]);
    }
  }, []);

  const handleImageUpload = async (file: File) => {
    try {
      setIsAnalyzing(true);
      setError(null);
      setAnalysisResult(null);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file (JPEG, PNG, WebP, etc.)');
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('Image file too large. Maximum size is 10MB.');
      }

      // Show image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Prepare form data
      const formData = new FormData();
      formData.append('image', file);
      formData.append('include_image_preview', 'true');

      // Call Claude Vision API
      const response = await fetch('http://localhost:8000/api/v1/medical-ocr/analyze-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result: ClaudeVisionAnalysis = await response.json();
      
      setAnalysisResult(result);
      onAnalysisComplete(result);

    } catch (error) {
      console.error('Claude Vision analysis failed:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze image');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMedicationClick = (medicationName: string) => {
    onMedicationSelect(medicationName);
  };

  const clearAnalysis = () => {
    setAnalysisResult(null);
    setSelectedImage(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
        <CardContent className="p-8">
          <div
            className={cn(
              "flex flex-col items-center justify-center space-y-4 text-center",
              isDragOver && "bg-blue-50 rounded-lg p-4"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex items-center space-x-2">
              <Eye className="h-8 w-8 text-blue-600" />
              <Image className="h-8 w-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Claude Sonnet 4 Vision Analysis
              </h3>
              <p className="text-gray-600 mb-4">
                Upload a prescription image for AI-powered analysis using Claude's advanced vision capabilities
              </p>
            </div>

            {isAnalyzing ? (
              <div className="flex items-center space-x-2 text-blue-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Analyzing image with Claude Vision...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="claude-vision-upload"
                />
                <label htmlFor="claude-vision-upload">
                  <Button asChild className="cursor-pointer">
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Select Prescription Image
                    </span>
                  </Button>
                </label>
                <p className="text-sm text-gray-500">
                  Or drag and drop an image here
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Analysis Failed</span>
            </div>
            <p className="text-red-600 mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Image Preview */}
      {selectedImage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Uploaded Image</span>
              <Button variant="ghost" size="sm" onClick={clearAnalysis}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <img
                src={selectedImage}
                alt="Uploaded prescription"
                className="max-w-full max-h-96 rounded-lg shadow-md"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span>Claude Vision Analysis Complete</span>
            </CardTitle>
            <div className="flex items-center space-x-4 text-sm text-green-700">
              <Badge variant="secondary">{analysisResult.ai_model}</Badge>
              <span>Confidence: {analysisResult.confidence}%</span>
              <span>{analysisResult.summary.medication_count} medications found</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Medications */}
            {analysisResult.extracted_data.medications.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Medications Found</h4>
                <div className="grid gap-3">
                  {analysisResult.extracted_data.medications.map((med, index) => (
                    <Card key={index} className="bg-white border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
                          onClick={() => handleMedicationClick(med.name)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900">{med.name}</h5>
                            <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-600">
                              {med.dosage && <span>Dosage: {med.dosage}</span>}
                              {med.frequency && <span>Frequency: {med.frequency}</span>}
                            </div>
                            {med.instructions && (
                              <p className="text-sm text-gray-500 mt-1">{med.instructions}</p>
                            )}
                          </div>
                          <Button variant="outline" size="sm">
                            Analyze
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Patient Information */}
            {analysisResult.extracted_data.patient_info && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Patient Information</h4>
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {analysisResult.extracted_data.patient_info.name && (
                        <div>
                          <span className="font-medium">Name:</span>
                          <span className="ml-2">{analysisResult.extracted_data.patient_info.name}</span>
                        </div>
                      )}
                      {analysisResult.extracted_data.patient_info.dob && (
                        <div>
                          <span className="font-medium">DOB:</span>
                          <span className="ml-2">{analysisResult.extracted_data.patient_info.dob}</span>
                        </div>
                      )}
                      {analysisResult.extracted_data.patient_info.prescriber && (
                        <div>
                          <span className="font-medium">Prescriber:</span>
                          <span className="ml-2">{analysisResult.extracted_data.patient_info.prescriber}</span>
                        </div>
                      )}
                      {analysisResult.extracted_data.patient_info.pharmacy && (
                        <div>
                          <span className="font-medium">Pharmacy:</span>
                          <span className="ml-2">{analysisResult.extracted_data.patient_info.pharmacy}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Additional Information */}
            {(analysisResult.extracted_data.symptoms.length > 0 || 
              analysisResult.extracted_data.allergies.length > 0 || 
              analysisResult.extracted_data.warnings.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysisResult.extracted_data.symptoms.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Symptoms</h5>
                    <div className="space-y-1">
                      {analysisResult.extracted_data.symptoms.map((symptom, index) => (
                        <Badge key={index} variant="outline" className="mr-1 mb-1">
                          {symptom}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.extracted_data.allergies.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Allergies</h5>
                    <div className="space-y-1">
                      {analysisResult.extracted_data.allergies.map((allergy, index) => (
                        <Badge key={index} variant="destructive" className="mr-1 mb-1">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.extracted_data.warnings.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Warnings</h5>
                    <div className="space-y-1">
                      {analysisResult.extracted_data.warnings.map((warning, index) => (
                        <Badge key={index} variant="secondary" className="mr-1 mb-1">
                          {warning}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Extracted Text */}
            {analysisResult.extracted_data.extracted_text && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Extracted Text</h4>
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {analysisResult.extracted_data.extracted_text}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ClaudeVisionUpload;
