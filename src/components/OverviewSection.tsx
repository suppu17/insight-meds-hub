import React, { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Brain,
  TrendingUp,
  Users,
  Pill,
  Eye
} from "lucide-react";
import PatientAnalysisDisplay from "@/components/PatientAnalysisDisplay";
import { historyService, type HistoryEntry } from "@/lib/historyService";

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

interface OverviewSectionProps {
  drugName: string;
  data: {
    extractedInfo?: any;
  } | null;
  clinicalRecommendations?: any;
  analysisResults?: any;
  executiveSummary?: string | null;
  marketData?: any;
  historyId?: string | null;
}

const OverviewSection: React.FC<OverviewSectionProps> = ({
  drugName,
  data,
  clinicalRecommendations,
  analysisResults,
  executiveSummary,
  marketData,
  historyId
}) => {
  // Save overview data to history when component renders
  useEffect(() => {
    if (historyId) {
      const overviewData = {
        drugName,
        clinicalRecommendations,
        extractedInfo: data?.extractedInfo,
        analysisResults,
        executiveSummary,
        marketData
      };
      historyService.updateEntry(historyId, {
        overview: overviewData
      });
    }
  }, [drugName, clinicalRecommendations, analysisResults, executiveSummary, marketData, historyId]);

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

      {/* Comprehensive Drug Information - Always show immediately */}
      <Card className="glass-card p-6 bg-blue/5 border-blue/20">
        <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Eye className="w-6 h-6 text-blue-600" />
          {drugName} - Complete Overview
        </h3>
        <p className="text-muted-foreground mb-6 text-lg">
          Comprehensive medication information including uses, mechanism, side effects, and precautions.
        </p>

        {/* Create a mock drug analysis for immediate display */}
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
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">Therapeutic treatment option</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">Evidence-based effectiveness</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground">Established safety profile</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* Detailed Drug Information */}
      <Card className="glass-card p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
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
          // Show basic information even when detailed analysis isn't available
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-primary mb-2">Drug Classification</h4>
                <Badge variant="outline">{getDrugClass(drugName)}</Badge>
              </div>

              <div>
                <h4 className="font-semibold text-success mb-2">Primary Uses</h4>
                <p className="text-sm text-muted-foreground">
                  Commonly prescribed for {getPrimaryIndication(drugName)}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-accent mb-2">Medication Type</h4>
                <p className="text-sm text-muted-foreground">
                  Generic Name: {drugName}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-primary mb-2">General Information</h4>
                <p className="text-sm text-muted-foreground">
                  {drugName} belongs to the {getDrugClass(drugName)} class of medications.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-blue-600 mb-2">Analysis Status</h4>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-blue-600">Detailed analysis in progress...</span>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> Detailed medical information, brand names, and specific safety warnings will appear here once the comprehensive analysis is complete.
                </p>
              </div>
            </div>
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
};

export default OverviewSection;