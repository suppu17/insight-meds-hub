/**
 * Comprehensive Drug Information Service
 * Integrates BrightData and TigerData for complete drug information
 */

import { getBrightDataDrugService, ComprehensiveDrugInfo } from './brightDataDrugService';
import { getTigerDataService, getTigerDataDrugInfo } from './tigerDataService';

export interface EnhancedDrugInfo extends ComprehensiveDrugInfo {
  tigerDataAnalysis?: any;
  brightDataSources?: any;
  dataIntegrity: {
    brightDataAvailable: boolean;
    tigerDataAvailable: boolean;
    combinedSources: number;
    lastUpdated: Date;
  };
}

class ComprehensiveDrugService {
  private brightDataService = getBrightDataDrugService();
  private tigerDataService = getTigerDataService();

  /**
   * Get comprehensive drug information from multiple sources
   */
  async getDrugInformation(drugName: string, sessionId?: string): Promise<EnhancedDrugInfo | null> {
    console.log(`🔍 Fetching comprehensive drug information for ${drugName}`);
    
    const startTime = Date.now();
    let brightDataResult: ComprehensiveDrugInfo | null = null;
    let tigerDataResult: any = null;
    let errors: string[] = [];

    // Fetch from BrightData
    try {
      console.log(`🌐 Fetching from BrightData for ${drugName}...`);
      brightDataResult = await this.brightDataService.getComprehensiveDrugInfo(drugName);
      if (brightDataResult) {
        console.log(`✅ BrightData fetch successful for ${drugName}`);
      }
    } catch (error) {
      const errorMsg = `BrightData fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.warn(errorMsg);
      errors.push(errorMsg);
    }

    // Fetch from TigerData
    try {
      console.log(`🐅 Fetching from TigerData for ${drugName}...`);
      const tigerResponse = await getTigerDataDrugInfo(drugName, sessionId);
      if (tigerResponse.success) {
        tigerDataResult = tigerResponse.data;
        console.log(`✅ TigerData fetch successful for ${drugName}`);
      } else {
        errors.push(`TigerData fetch failed: ${tigerResponse.error}`);
      }
    } catch (error) {
      const errorMsg = `TigerData fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.warn(errorMsg);
      errors.push(errorMsg);
    }

    // If both sources failed, return null
    if (!brightDataResult && !tigerDataResult) {
      console.error(`❌ All data sources failed for ${drugName}:`, errors);
      return null;
    }

    // Combine and enhance the data
    const enhancedInfo = this.combineDataSources(drugName, brightDataResult, tigerDataResult);
    
    const processingTime = Date.now() - startTime;
    console.log(`🎯 Comprehensive drug info compiled for ${drugName} in ${processingTime}ms`);
    
    return enhancedInfo;
  }

  /**
   * Combine data from BrightData and TigerData sources
   */
  private combineDataSources(
    drugName: string,
    brightDataResult: ComprehensiveDrugInfo | null,
    tigerDataResult: any
  ): EnhancedDrugInfo {
    // Start with BrightData as base or create new structure
    const baseInfo: ComprehensiveDrugInfo = brightDataResult || {
      drugName,
      genericName: drugName,
      brandNames: [],
      drugClass: '',
      overview: '',
      primaryUses: [],
      secondaryUses: [],
      offLabelUses: [],
      mechanismOfAction: {
        description: '',
        targetSystems: [],
        pharmacokinetics: {
          absorption: '',
          distribution: '',
          metabolism: '',
          elimination: ''
        }
      },
      dosageInfo: {
        availableForms: [],
        commonDosages: [],
        administrationRoute: [],
        specialInstructions: []
      },
      sideEffects: {
        common: [],
        serious: [],
        rare: []
      },
      contraindications: [],
      warnings: [],
      precautions: [],
      interactions: {
        majorInteractions: [],
        moderateInteractions: [],
        foodInteractions: []
      },
      additionalBenefits: [],
      ongoingResearch: [],
      storageInstructions: [],
      emergencyInfo: [],
      fdaApproved: false,
      lastUpdated: new Date(),
      sources: []
    };

    // Enhance with TigerData information
    if (tigerDataResult) {
      // Merge TigerData insights
      if (tigerDataResult.overview && !baseInfo.overview) {
        baseInfo.overview = tigerDataResult.overview;
      }
      
      if (tigerDataResult.uses && Array.isArray(tigerDataResult.uses)) {
        baseInfo.primaryUses = [...new Set([...baseInfo.primaryUses, ...tigerDataResult.uses])];
      }
      
      if (tigerDataResult.sideEffects && Array.isArray(tigerDataResult.sideEffects)) {
        baseInfo.sideEffects.common = [...new Set([...baseInfo.sideEffects.common, ...tigerDataResult.sideEffects])];
      }
      
      if (tigerDataResult.interactions && Array.isArray(tigerDataResult.interactions)) {
        baseInfo.interactions.majorInteractions = [...new Set([...baseInfo.interactions.majorInteractions, ...tigerDataResult.interactions])];
      }

      // Add TigerData source
      baseInfo.sources.push({
        name: 'TigerData',
        url: 'https://api.tigerdata.com',
        type: 'Medical Database',
        reliability: 'High'
      });
    }

    // Create enhanced info with metadata
    const enhancedInfo: EnhancedDrugInfo = {
      ...baseInfo,
      tigerDataAnalysis: tigerDataResult,
      brightDataSources: brightDataResult?.sources || [],
      dataIntegrity: {
        brightDataAvailable: !!brightDataResult,
        tigerDataAvailable: !!tigerDataResult,
        combinedSources: (brightDataResult?.sources?.length || 0) + (tigerDataResult ? 1 : 0),
        lastUpdated: new Date()
      }
    };

    return enhancedInfo;
  }

  /**
   * Get service statistics
   */
  getServiceStats() {
    return {
      brightDataStats: this.brightDataService.getCacheStats(),
      tigerDataStats: this.tigerDataService.getStats(),
      timestamp: new Date()
    };
  }

  /**
   * Clear all caches
   */
  clearCaches() {
    this.brightDataService.clearCache();
    this.tigerDataService.clearData();
    console.log('🧹 All drug service caches cleared');
  }
}

// Singleton instance
let comprehensiveDrugService: ComprehensiveDrugService | null = null;

/**
 * Get or create comprehensive drug service instance
 */
export function getComprehensiveDrugService(): ComprehensiveDrugService {
  if (!comprehensiveDrugService) {
    comprehensiveDrugService = new ComprehensiveDrugService();
  }
  return comprehensiveDrugService;
}

/**
 * Quick function to get enhanced drug information from all sources
 */
export async function getEnhancedDrugInfo(drugName: string, sessionId?: string): Promise<EnhancedDrugInfo | null> {
  const service = getComprehensiveDrugService();
  return await service.getDrugInformation(drugName, sessionId);
}

export default ComprehensiveDrugService;
