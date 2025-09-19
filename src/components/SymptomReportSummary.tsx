import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Download,
  Share2,
  User,
  Calendar,
  IdCard,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react';
import { pdfGenerationService, type SymptomEntry, type PatientInfo } from '@/lib/services/pdfGenerationService';

interface SymptomReportSummaryProps {
  entries: SymptomEntry[];
  isOpen: boolean;
  onClose: () => void;
}

const SymptomReportSummary: React.FC<SymptomReportSummaryProps> = ({
  entries,
  isOpen,
  onClose
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: '',
    dateOfBirth: '',
    patientId: '',
    reportDate: new Date().toISOString()
  });
  const [generatedPDF, setGeneratedPDF] = useState<{
    pdfBlob: Blob;
    fileName: string;
    shareableUrl: string;
  } | null>(null);

  const handlePatientInfoChange = (field: keyof PatientInfo, value: string) => {
    setPatientInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const result = pdfGenerationService.generateSymptomReport(entries, patientInfo);
      setGeneratedPDF(result);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedPDF) {
      const link = document.createElement('a');
      link.href = generatedPDF.shareableUrl;
      link.download = generatedPDF.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    if (generatedPDF) {
      try {
        await pdfGenerationService.sharePDF(generatedPDF.fileName, generatedPDF.pdfBlob);
      } catch (error) {
        console.error('Error sharing PDF:', error);
        // Fallback to download
        handleDownload();
      }
    }
  };

  const handleClose = () => {
    setGeneratedPDF(null);
    setPatientInfo({
      name: '',
      dateOfBirth: '',
      patientId: '',
      reportDate: new Date().toISOString()
    });
    onClose();
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    if (entries.length === 0) return null;

    const severityCount = entries.reduce(
      (acc, entry) => {
        const severity = entry.severity || 'mild';
        acc[severity]++;
        return acc;
      },
      { mild: 0, moderate: 0, severe: 0 }
    );

    const dates = entries.map(entry => entry.timestamp).sort((a, b) => a.getTime() - b.getTime());
    const dateRange = {
      earliest: dates[0],
      latest: dates[dates.length - 1]
    };

    const concernCount: { [key: string]: number } = {};
    entries.forEach(entry => {
      const concern = entry.concern.toLowerCase().trim();
      concernCount[concern] = (concernCount[concern] || 0) + 1;
    });

    const topConcerns = Object.entries(concernCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([concern, count]) => ({ concern, count }));

    return {
      totalEntries: entries.length,
      severityCount,
      dateRange,
      topConcerns
    };
  };

  const stats = getSummaryStats();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'severe': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'mild': return <CheckCircle className="w-4 h-4" />;
      case 'moderate': return <Clock className="w-4 h-4" />;
      case 'severe': return <AlertCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Symptom Report Summary
          </DialogTitle>
          <DialogDescription>
            Generate a comprehensive PDF report of your symptom history for sharing with healthcare providers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Information Form */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Patient Information (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Full Name</Label>
                <Input
                  id="patientName"
                  placeholder="Enter patient name"
                  value={patientInfo.name}
                  onChange={(e) => handlePatientInfoChange('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={patientInfo.dateOfBirth}
                  onChange={(e) => handlePatientInfoChange('dateOfBirth', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient ID (Optional)</Label>
                <Input
                  id="patientId"
                  placeholder="Enter patient ID"
                  value={patientInfo.patientId}
                  onChange={(e) => handlePatientInfoChange('patientId', e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Report Summary */}
          {stats && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Report Overview
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-stone-800/40 backdrop-blur-sm rounded-xl border border-stone-700/50 shadow-lg">
                  <div className="text-2xl font-bold text-blue-400">{stats.totalEntries}</div>
                  <div className="text-sm text-white/80">Total Entries</div>
                </div>
                
                <div className="text-center p-4 bg-stone-800/40 backdrop-blur-sm rounded-xl border border-stone-700/50 shadow-lg">
                  <div className="text-2xl font-bold text-green-400">{stats.severityCount.mild}</div>
                  <div className="text-sm text-white/80">Mild Symptoms</div>
                </div>
                
                <div className="text-center p-4 bg-stone-800/40 backdrop-blur-sm rounded-xl border border-stone-700/50 shadow-lg">
                  <div className="text-2xl font-bold text-orange-400">{stats.severityCount.moderate}</div>
                  <div className="text-sm text-white/80">Moderate Symptoms</div>
                </div>
                
                <div className="text-center p-4 bg-stone-800/40 backdrop-blur-sm rounded-xl border border-stone-700/50 shadow-lg">
                  <div className="text-2xl font-bold text-red-400">{stats.severityCount.severe}</div>
                  <div className="text-sm text-white/80">Severe Symptoms</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-white font-bold" />
                    Reporting Period
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {stats.dateRange.earliest.toLocaleDateString()} - {stats.dateRange.latest.toLocaleDateString()}
                  </p>
                </div>

                {stats.topConcerns.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Most Common Concerns</h4>
                    <div className="flex flex-wrap gap-2">
                      {stats.topConcerns.map((concern, index) => (
                        <Badge key={index} variant="secondary" className="capitalize">
                          {concern.concern} ({concern.count})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Recent Entries Preview */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Recent Entries Preview</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {entries.slice(0, 5).map((entry, index) => (
                <div key={entry.id} className="bg-stone-800/30 border border-stone-700/30 rounded-xl p-4 transition-colors hover:bg-stone-800/40">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={`px-2 py-1 text-xs ${getSeverityColor(entry.severity || 'mild')}`}>
                          {getSeverityIcon(entry.severity || 'mild')}
                          <span className="ml-1 capitalize">{entry.severity || 'mild'}</span>
                        </Badge>
                        <span className="text-xs text-white/60 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-white font-bold" />
                          {entry.timestamp.toLocaleDateString()} at {entry.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-sm text-white/80 min-w-fit">Concern:</span>
                          <span className="text-sm text-white">{entry.concern}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-sm text-white/80 min-w-fit">Symptoms:</span>
                          <span className="text-sm text-white line-clamp-2">{entry.symptoms}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {entries.length > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  ... and {entries.length - 5} more entries
                </p>
              )}
            </div>
          </Card>

          {/* PDF Generation Status */}
          {generatedPDF && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">PDF Generated Successfully</h3>
              </div>
              <p className="text-sm text-green-700 mb-4">
                Your symptom report has been generated and is ready for download or sharing.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button onClick={handleShare} variant="outline" className="border-green-300 text-green-700 hover:bg-green-500 hover:text-white rounded-xl shadow-lg bg-green-50">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share PDF
                </Button>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="rounded-xl shadow-lg">
            Cancel
          </Button>
          {!generatedPDF && (
            <Button 
              onClick={handleGeneratePDF} 
              disabled={isGenerating || entries.length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate PDF Report
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SymptomReportSummary;
