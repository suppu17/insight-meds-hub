import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Activity,
  Heart,
  Scale,
  Ruler,
  TestTube,
  AlertTriangle,
  CheckCircle,
  Clock,
  Stethoscope,
  Users,
  Pill,
  FileText,
  TrendingUp,
  Shield,
  Info,
  ExternalLink
} from 'lucide-react';

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

interface PersonalizedRecommendations {
  drugInteractions: string[];
  contraindications: string[];
  dosageAdjustments: string[];
  monitoring: string[];
  lifestyle: string[];
  alerts: string[];
}

interface PatientAnalysisDisplayProps {
  extractedInfo: ExtractedMedicalInfo;
  primaryMedication: string;
  recommendations?: PersonalizedRecommendations;
  onClose?: () => void;
}

const PatientAnalysisDisplay: React.FC<PatientAnalysisDisplayProps> = ({
  extractedInfo,
  primaryMedication,
  recommendations,
  onClose
}) => {
  return (
    <div className="space-y-6">
      {/* Header with Patient Information */}
      {extractedInfo.patientInfo && (
        <Card className="glass-card p-6 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
              <User className="w-6 h-6" />
              Patient Profile
            </h2>
            {onClose && (
              <Button onClick={onClose} variant="ghost" size="sm">
                ×
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {extractedInfo.patientInfo.name && (
              <div className="text-center p-3 glass-panel rounded-lg">
                <div className="font-semibold text-foreground">{extractedInfo.patientInfo.name}</div>
                <div className="text-sm text-muted-foreground">Patient Name</div>
              </div>
            )}
            {extractedInfo.patientInfo.age && (
              <div className="text-center p-3 glass-panel rounded-lg">
                <div className="font-semibold text-primary">{extractedInfo.patientInfo.age} years</div>
                <div className="text-sm text-muted-foreground">Age</div>
              </div>
            )}
            {extractedInfo.patientInfo.gender && (
              <div className="text-center p-3 glass-panel rounded-lg">
                <div className="font-semibold text-accent">{extractedInfo.patientInfo.gender}</div>
                <div className="text-sm text-muted-foreground">Gender</div>
              </div>
            )}
            {extractedInfo.patientInfo.mrn && (
              <div className="text-center p-3 glass-panel rounded-lg">
                <div className="font-semibold text-muted-foreground text-xs">{extractedInfo.patientInfo.mrn}</div>
                <div className="text-sm text-muted-foreground">MRN</div>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vital Signs */}
        {extractedInfo.vitals && (
          <Card className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Vital Signs
            </h3>
            <div className="space-y-3">
              {extractedInfo.vitals.bloodPressure && (
                <div className="flex items-center justify-between p-3 glass-panel rounded-lg">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="font-medium">Blood Pressure</span>
                  </div>
                  <Badge variant="secondary">{extractedInfo.vitals.bloodPressure}</Badge>
                </div>
              )}
              {extractedInfo.vitals.heartRate && (
                <div className="flex items-center justify-between p-3 glass-panel rounded-lg">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" />
                    <span className="font-medium">Heart Rate</span>
                  </div>
                  <Badge variant="secondary">{extractedInfo.vitals.heartRate}</Badge>
                </div>
              )}
              {extractedInfo.vitals.weight && (
                <div className="flex items-center justify-between p-3 glass-panel rounded-lg">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Weight</span>
                  </div>
                  <Badge variant="secondary">{extractedInfo.vitals.weight}</Badge>
                </div>
              )}
              {extractedInfo.vitals.height && (
                <div className="flex items-center justify-between p-3 glass-panel rounded-lg">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-green-500" />
                    <span className="font-medium">Height</span>
                  </div>
                  <Badge variant="secondary">{extractedInfo.vitals.height}</Badge>
                </div>
              )}
              {extractedInfo.vitals.bmi && (
                <div className="flex items-center justify-between p-3 glass-panel rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <span className="font-medium">BMI</span>
                  </div>
                  <Badge variant="secondary">{extractedInfo.vitals.bmi}</Badge>
                </div>
              )}
              {extractedInfo.vitals.temperature && (
                <div className="flex items-center justify-between p-3 glass-panel rounded-lg">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-orange-500" />
                    <span className="font-medium">Temperature</span>
                  </div>
                  <Badge variant="secondary">{extractedInfo.vitals.temperature}</Badge>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Current Medications */}
        {extractedInfo.concomitantMedications && extractedInfo.concomitantMedications.length > 0 && (
          <Card className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Pill className="w-5 h-5 text-primary" />
              Current Medications
              <Badge variant="secondary" className="ml-2">
                {extractedInfo.concomitantMedications.length} medications
              </Badge>
            </h3>
            <div className="space-y-3">
              {extractedInfo.concomitantMedications.map((med, index) => (
                <div key={index} className="p-4 glass-panel rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-foreground">{med.medication}</h4>
                    {med.medication.toLowerCase() === primaryMedication.toLowerCase() && (
                      <Badge className="text-xs bg-primary text-primary-foreground">Primary</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Dosage:</span>
                      <span className="ml-1 font-medium">{med.dosage}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Frequency:</span>
                      <span className="ml-1 font-medium">{med.frequency}</span>
                    </div>
                    {med.indication && (
                      <div className="md:col-span-2">
                        <span className="text-muted-foreground">For:</span>
                        <span className="ml-1 font-medium text-accent">{med.indication}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Medical History */}
      {extractedInfo.medicalHistory && (
        <Card className="glass-card p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Medical History
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {extractedInfo.medicalHistory.pastMedicalHistory && extractedInfo.medicalHistory.pastMedicalHistory.length > 0 && (
              <div>
                <h4 className="font-semibold text-foreground mb-3">Past Medical History</h4>
                <div className="space-y-2">
                  {extractedInfo.medicalHistory.pastMedicalHistory.map((condition, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />
                      <span>{condition}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {extractedInfo.medicalHistory.allergies && extractedInfo.medicalHistory.allergies.length > 0 && (
              <div>
                <h4 className="font-semibold text-destructive mb-3">Allergies</h4>
                <div className="space-y-2">
                  {extractedInfo.medicalHistory.allergies.map((allergy, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="w-3 h-3 text-destructive flex-shrink-0" />
                      <span>{allergy}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {extractedInfo.medicalHistory.familyHistory && extractedInfo.medicalHistory.familyHistory.length > 0 && (
              <div>
                <h4 className="font-semibold text-accent mb-3">Family History</h4>
                <div className="space-y-2">
                  {extractedInfo.medicalHistory.familyHistory.map((history, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Users className="w-3 h-3 text-accent flex-shrink-0" />
                      <span>{history}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {extractedInfo.medicalHistory.socialHistory && extractedInfo.medicalHistory.socialHistory.length > 0 && (
              <div className="md:col-span-2 lg:col-span-3">
                <h4 className="font-semibold text-muted-foreground mb-3">Social History</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {extractedInfo.medicalHistory.socialHistory.map((social, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Info className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      <span>{social}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Lab Results */}
      {extractedInfo.labResults && extractedInfo.labResults.length > 0 && (
        <Card className="glass-card p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TestTube className="w-5 h-5 text-primary" />
            Laboratory Results
            <Badge variant="secondary" className="ml-2">
              {extractedInfo.labResults.length} tests
            </Badge>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {extractedInfo.labResults.map((lab, index) => (
              <div key={index} className="p-4 glass-panel rounded-lg">
                <div className="font-semibold text-foreground">{lab.testName}</div>
                <div className="text-lg font-bold text-primary">{lab.value}</div>
                {lab.date && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {lab.date}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Assessment & Treatment Plan */}
      {extractedInfo.assessment && (
        <Card className="glass-card p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            Clinical Assessment
          </h3>
          <div className="space-y-6">
            {extractedInfo.assessment.primaryDiagnosis && (
              <div>
                <h4 className="font-semibold text-primary mb-2">Primary Diagnosis</h4>
                <div className="p-3 glass-panel rounded-lg bg-primary/5">
                  <span className="font-medium">{extractedInfo.assessment.primaryDiagnosis}</span>
                </div>
              </div>
            )}

            {extractedInfo.assessment.secondaryDiagnoses && extractedInfo.assessment.secondaryDiagnoses.length > 0 && (
              <div>
                <h4 className="font-semibold text-accent mb-2">Secondary Diagnoses</h4>
                <div className="space-y-2">
                  {extractedInfo.assessment.secondaryDiagnoses.map((diagnosis, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 glass-panel rounded-lg">
                      <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                      <span>{diagnosis}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {extractedInfo.assessment.treatmentPlan && extractedInfo.assessment.treatmentPlan.length > 0 && (
              <div>
                <h4 className="font-semibold text-success mb-2">Treatment Plan</h4>
                <div className="space-y-2">
                  {extractedInfo.assessment.treatmentPlan.map((plan, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 glass-panel rounded-lg bg-success/5">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      <span>{plan}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Personalized Recommendations */}
      {recommendations && (
        <Card className="glass-card p-6 bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            AI-Powered Recommendations for {primaryMedication}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.alerts && recommendations.alerts.length > 0 && (
              <div className="p-4 glass-panel rounded-lg bg-destructive/5 border-destructive/20">
                <h4 className="font-semibold text-destructive mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Critical Alerts
                </h4>
                <div className="space-y-2">
                  {recommendations.alerts.map((alert, index) => (
                    <div key={index} className="text-sm text-destructive">
                      • {alert}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendations.drugInteractions && recommendations.drugInteractions.length > 0 && (
              <div className="p-4 glass-panel rounded-lg bg-warning/5 border-warning/20">
                <h4 className="font-semibold text-warning mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Drug Interactions
                </h4>
                <div className="space-y-2">
                  {recommendations.drugInteractions.map((interaction, index) => (
                    <div key={index} className="text-sm text-warning">
                      • {interaction}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendations.dosageAdjustments && recommendations.dosageAdjustments.length > 0 && (
              <div className="p-4 glass-panel rounded-lg bg-primary/5 border-primary/20">
                <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                  <Pill className="w-4 h-4" />
                  Dosage Considerations
                </h4>
                <div className="space-y-2">
                  {recommendations.dosageAdjustments.map((adjustment, index) => (
                    <div key={index} className="text-sm text-primary">
                      • {adjustment}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendations.monitoring && recommendations.monitoring.length > 0 && (
              <div className="p-4 glass-panel rounded-lg bg-success/5 border-success/20">
                <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                  <TestTube className="w-4 h-4" />
                  Monitoring Required
                </h4>
                <div className="space-y-2">
                  {recommendations.monitoring.map((monitor, index) => (
                    <div key={index} className="text-sm text-success">
                      • {monitor}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recommendations.lifestyle && recommendations.lifestyle.length > 0 && (
              <div className="p-4 glass-panel rounded-lg bg-accent/5 border-accent/20 md:col-span-2">
                <h4 className="font-semibold text-accent mb-3 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Lifestyle Recommendations
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {recommendations.lifestyle.map((lifestyle, index) => (
                    <div key={index} className="text-sm text-accent">
                      • {lifestyle}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Provider Information */}
      {extractedInfo.prescriber && (
        <Card className="glass-card p-6 bg-muted/5">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-muted-foreground" />
            Healthcare Provider
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {extractedInfo.prescriber.name && (
              <div>
                <div className="text-sm text-muted-foreground">Provider</div>
                <div className="font-medium">{extractedInfo.prescriber.name}</div>
              </div>
            )}
            {extractedInfo.prescriber.specialty && (
              <div>
                <div className="text-sm text-muted-foreground">Specialty</div>
                <div className="font-medium">{extractedInfo.prescriber.specialty}</div>
              </div>
            )}
            {extractedInfo.prescriber.clinic && (
              <div>
                <div className="text-sm text-muted-foreground">Clinic</div>
                <div className="font-medium">{extractedInfo.prescriber.clinic}</div>
              </div>
            )}
            {extractedInfo.prescriber.contactInfo && (
              <div>
                <div className="text-sm text-muted-foreground">Contact</div>
                <div className="font-medium">{extractedInfo.prescriber.contactInfo}</div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Medical Disclaimer */}
      <Card className="glass-card p-4 border-accent/20">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-accent mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-accent">Patient Data Analysis Disclaimer</p>
            <p className="text-muted-foreground">
              This analysis is based on extracted document data and AI-powered insights. It should be used for
              informational purposes only and does not replace professional medical consultation. Always verify
              patient information and treatment recommendations with qualified healthcare providers.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PatientAnalysisDisplay;