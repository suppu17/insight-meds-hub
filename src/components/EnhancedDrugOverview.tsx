import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Brain,
  Pill,
  Eye,
  Heart,
  Activity,
  Clock,
  Thermometer,
  Users,
  BookOpen,
  Zap,
  Target,
  AlertCircle,
  Info,
  Loader2
} from "lucide-react";
import { getComprehensiveDrugInfo, type ComprehensiveDrugInfo } from "@/lib/services/brightDataDrugService";
import { getFallbackDrugInfo } from "@/lib/services/fallbackDrugService";

interface EnhancedDrugOverviewProps {
  drugName: string;
  className?: string;
}

const EnhancedDrugOverview: React.FC<EnhancedDrugOverviewProps> = ({
  drugName,
  className = ""
}) => {
  const [drugInfo, setDrugInfo] = useState<ComprehensiveDrugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDrugInfo = async () => {
      if (!drugName) return;

      setIsLoading(true);
      setError(null);

      try {
        console.log(`🔍 Fetching comprehensive drug information for: ${drugName}`);
        
        // Try Bright Data first
        let info = await getComprehensiveDrugInfo(drugName);
        
        // If Bright Data fails, try fallback service
        if (!info) {
          console.log(`⚠️ Bright Data unavailable, trying fallback service for ${drugName}`);
          info = await getFallbackDrugInfo(drugName);
        }
        
        if (info) {
          setDrugInfo(info);
          console.log(`✅ Successfully loaded comprehensive data for ${drugName}`);
        } else {
          setError(`No comprehensive information found for "${drugName}"`);
        }
      } catch (err) {
        console.error('Error fetching drug information:', err);
        
        // Try fallback as last resort
        try {
          console.log(`🔄 Attempting fallback service as last resort for ${drugName}`);
          const fallbackInfo = await getFallbackDrugInfo(drugName);
          if (fallbackInfo) {
            setDrugInfo(fallbackInfo);
            console.log(`✅ Loaded fallback data for ${drugName}`);
          } else {
            setError(`Failed to load information for "${drugName}"`);
          }
        } catch (fallbackErr) {
          console.error('Fallback service also failed:', fallbackErr);
          setError(`Failed to load information for "${drugName}"`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDrugInfo();
  }, [drugName]);

  if (isLoading) {
    return (
      <Card className={`glass-card p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-lg">Loading comprehensive drug information...</span>
          </div>
        </div>
      </Card>
    );
  }

  if (error || !drugInfo) {
    return (
      <Card className={`glass-card p-6 bg-amber/5 border-amber/20 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-500 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-amber-800 mb-2">
              Limited Information Available
            </h3>
            <p className="text-amber-700 mb-4">
              {error || `Unable to fetch comprehensive information for "${drugName}"`}
            </p>
            <p className="text-sm text-amber-600">
              This might be due to network issues or the medication not being in our comprehensive database. 
              Basic FDA validation may still be available.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Overview Card */}
      <Card className="glass-card p-6 bg-black/20 border-white/10 backdrop-blur-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-blue-500/20 rounded-full border border-blue-400/30">
            <Eye className="w-8 h-8 text-blue-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-white mb-2">
              {drugInfo.drugName} - Complete Overview
            </h2>
            <p className="text-gray-200 text-lg leading-relaxed">
              {drugInfo.overview || `${drugInfo.drugName} is a ${drugInfo.drugClass} medication with comprehensive therapeutic applications.`}
            </p>
            {drugInfo.fdaApproved && (
              <div className="flex items-center gap-2 mt-4">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-300 font-medium">FDA Approved Medication</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-400" />
              What is {drugInfo.drugName}?
            </h4>
            <div className="space-y-2 text-sm text-gray-200">
              <div><strong className="text-white">Generic Name:</strong> {drugInfo.genericName}</div>
              <div><strong className="text-white">Drug Class:</strong> {drugInfo.drugClass}</div>
              {drugInfo.brandNames.length > 0 && (
                <div>
                  <strong>Brand Names:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {drugInfo.brandNames.slice(0, 3).map((name, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {name}
                      </Badge>
                    ))}
                    {drugInfo.brandNames.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{drugInfo.brandNames.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Primary Uses & Benefits
            </h4>
            <ul className="space-y-1 text-sm">
              {drugInfo.primaryUses.slice(0, 4).map((use, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-400 mt-1 flex-shrink-0" />
                  <span className="text-gray-200">{use}</span>
                </li>
              ))}
              {drugInfo.primaryUses.length > 4 && (
                <li className="text-xs text-gray-500 ml-5">
                  +{drugInfo.primaryUses.length - 4} additional uses
                </li>
              )}
            </ul>
          </div>
        </div>
      </Card>

      {/* Detailed Information Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Mechanism of Action */}
        {drugInfo.mechanismOfAction.description && (
          <Card className="glass-card p-6 bg-black/20 border-white/10 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
              <Target className="w-6 h-6 text-purple-400" />
              Mechanism of Action
            </h3>
            <p className="text-gray-200 mb-4 leading-relaxed">
              {drugInfo.mechanismOfAction.description}
            </p>
            {drugInfo.mechanismOfAction.targetSystems.length > 0 && (
              <div>
                <h4 className="font-semibold text-purple-300 mb-2">Target Systems:</h4>
                <div className="flex flex-wrap gap-2">
                  {drugInfo.mechanismOfAction.targetSystems.map((system, i) => (
                    <Badge key={i} variant="outline" className="text-purple-300 border-purple-400/50 bg-purple-500/10">
                      {system}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Dosage Information */}
        {drugInfo.dosageInfo.availableForms.length > 0 && (
          <Card className="glass-card p-6 bg-black/20 border-white/10 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
              <Activity className="w-6 h-6 text-blue-400" />
              Forms and Dosage
            </h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-blue-300 mb-2">Available Forms:</h4>
                <div className="flex flex-wrap gap-2">
                  {drugInfo.dosageInfo.availableForms.map((form, i) => (
                    <Badge key={i} variant="secondary" className="text-blue-300 bg-blue-500/20 border-blue-400/30">
                      {form}
                    </Badge>
                  ))}
                </div>
              </div>
              {drugInfo.dosageInfo.specialInstructions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-blue-300 mb-2">Administration:</h4>
                  <ul className="text-sm space-y-1">
                    {drugInfo.dosageInfo.specialInstructions.slice(0, 3).map((instruction, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Info className="w-3 h-3 text-blue-400 mt-1 flex-shrink-0" />
                        <span className="text-gray-200">{instruction}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Side Effects */}
        <Card className="glass-card p-6 bg-black/20 border-white/10 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <AlertCircle className="w-6 h-6 text-orange-400" />
            Common Side Effects
          </h3>
          <div className="space-y-4">
            {drugInfo.sideEffects.common.length > 0 && (
              <div>
                <h4 className="font-semibold text-orange-300 mb-2">Common:</h4>
                <ul className="text-sm space-y-1">
                  {drugInfo.sideEffects.common.slice(0, 4).map((effect, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-200">{effect}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {drugInfo.sideEffects.serious.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-300 mb-2">Serious (Seek Medical Attention):</h4>
                <ul className="text-sm space-y-1">
                  {drugInfo.sideEffects.serious.slice(0, 3).map((effect, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-red-400 mt-1 flex-shrink-0" />
                      <span className="text-gray-200">{effect}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>

        {/* Additional Benefits */}
        {drugInfo.additionalBenefits.length > 0 && (
          <Card className="glass-card p-6 bg-black/20 border-white/10 backdrop-blur-sm">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
              <Heart className="w-6 h-6 text-green-400" />
              Additional Benefits
            </h3>
            <ul className="space-y-2 text-sm">
              {drugInfo.additionalBenefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Heart className="w-3 h-3 text-green-400 mt-1 flex-shrink-0" />
                  <span className="text-gray-200">{benefit}</span>
                </li>
              ))}
            </ul>
            {drugInfo.ongoingResearch.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <h4 className="font-semibold text-green-300 mb-2">Ongoing Research:</h4>
                <ul className="text-xs text-gray-400 space-y-1">
                  {drugInfo.ongoingResearch.slice(0, 2).map((research, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <BookOpen className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-400" />
                      <span>{research}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Warnings and Precautions */}
      {(drugInfo.warnings.length > 0 || drugInfo.precautions.length > 0 || drugInfo.contraindications.length > 0) && (
        <Card className="glass-card p-6 bg-black/30 border-red-400/20 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <Shield className="w-6 h-6 text-red-400" />
            Important Safety Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {drugInfo.warnings.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-300 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Warnings
                </h4>
                <ul className="text-sm space-y-2">
                  {drugInfo.warnings.slice(0, 3).map((warning, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-200">{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {drugInfo.precautions.length > 0 && (
              <div>
                <h4 className="font-semibold text-orange-300 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Precautions
                </h4>
                <ul className="text-sm space-y-2">
                  {drugInfo.precautions.slice(0, 3).map((precaution, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-200">{precaution}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {drugInfo.contraindications.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-300 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Contraindications
                </h4>
                <ul className="text-sm space-y-2">
                  {drugInfo.contraindications.slice(0, 3).map((contraindication, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-200">{contraindication}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Storage and Emergency Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {drugInfo.storageInstructions.length > 0 && (
          <Card className="glass-card p-6 bg-black/30 border-white/20 backdrop-blur-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
              <Thermometer className="w-5 h-5 text-blue-400" />
              Storage
            </h3>
            <ul className="text-sm space-y-2">
              {drugInfo.storageInstructions.map((instruction, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Info className="w-3 h-3 text-blue-400 mt-1 flex-shrink-0" />
                  <span className="text-gray-200">{instruction}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card className="glass-card p-6 bg-black/30 border-amber-400/20 backdrop-blur-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Emergency Reminder
          </h3>
          <div className="text-sm space-y-2">
            <p className="font-medium text-orange-200">
              Always consult a healthcare professional before starting or stopping {drugInfo.drugName}.
            </p>
            <p className="text-orange-300">
              Seek immediate medical attention if severe side effects occur.
            </p>
            {drugInfo.emergencyInfo.length > 0 && (
              <ul className="mt-3 space-y-1">
                {drugInfo.emergencyInfo.map((info, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertCircle className="w-3 h-3 text-amber-400 mt-1 flex-shrink-0" />
                    <span className="text-orange-200">{info}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {/* Sources */}
      <Card className="glass-card p-6 bg-black/30 border-white/20 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
          <ExternalLink className="w-6 h-6 text-blue-400" />
          Sources & References
        </h3>
        <p className="text-sm text-gray-300 mb-4">
          Information compiled from multiple trusted medical sources. Last updated: {drugInfo.lastUpdated.toLocaleDateString()}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {drugInfo.sources.map((source, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors border border-white/20">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs text-gray-300 border-gray-500">
                  {source.type}
                </Badge>
                <span className="font-medium text-sm text-gray-200">{source.name}</span>
              </div>
              <Button size="sm" variant="ghost" asChild>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Medical Disclaimer */}
      <Card className="glass-card p-4 bg-black/30 border-white/20 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-gray-300">
            <p className="font-medium mb-1 text-gray-200">Medical Disclaimer</p>
            <p>
              This information is for educational purposes only and does not replace professional medical advice. 
              Always consult your healthcare provider before making medication decisions.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EnhancedDrugOverview;
