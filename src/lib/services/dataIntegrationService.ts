/**
 * Data Integration Service
 * Orchestrates all data sources and provides unified access to medical information
 */

import { getComprehensiveDrugService, getEnhancedDrugInfo, EnhancedDrugInfo } from './comprehensiveDrugService';
import { getTigerDataService, analyzeSymptomsWithTigerData, getTigerDataMarketResearch } from './tigerDataService';
import { getBrightDataDrugService } from './brightDataDrugService';

export interface DataIntegrationConfig {
  enableBrightData: boolean;
  enableTigerData: boolean;
  enableFallback: boolean;
  maxRetries: number;
  timeout: number;
}

export interface IntegratedHealthData {
  drugInformation?: EnhancedDrugInfo;
  symptomAnalysis?: any;
  marketResearch?: any;
  dataQuality: {
    sources: string[];
    reliability: number;
    completeness: number;
    lastUpdated: Date;
  };
  performance: {
    totalTime: number;
    sourceResponseTimes: Record<string, number>;
    cacheHits: number;
    errors: string[];
  };
}

class DataIntegrationService {
  private config: DataIntegrationConfig;
  private comprehensiveDrugService = getComprehensiveDrugService();
  private tigerDataService = getTigerDataService();
  private brightDataService = getBrightDataDrugService();

  constructor(config?: Partial<DataIntegrationConfig>) {
    this.config = {
      enableBrightData: true,
      enableTigerData: true,
      enableFallback: true,
      maxRetries: 3,
      timeout: 30000,
      ...config
    };

    console.log('🔗 Data Integration Service initialized', this.config);
  }

  /**
   * Get comprehensive health data for a specific query
   */
  async getHealthData(query: {
    drugName?: string;
    symptoms?: string[];
    marketQuery?: string;
    patientInfo?: {
      age?: number;
      gender?: string;
      medicalHistory?: string[];
    };
    sessionId?: string;
  }): Promise<IntegratedHealthData> {
    const startTime = Date.now();
    const sourceResponseTimes: Record<string, number> = {};
    const sources: string[] = [];
    const errors: string[] = [];
    let cacheHits = 0;

    console.log('🚀 Starting comprehensive health data integration', query);

    const result: IntegratedHealthData = {
      dataQuality: {
        sources: [],
        reliability: 0,
        completeness: 0,
        lastUpdated: new Date()
      },
      performance: {
        totalTime: 0,
        sourceResponseTimes: {},
        cacheHits: 0,
        errors: []
      }
    };

    // Fetch drug information if requested
    if (query.drugName) {
      try {
        const drugStartTime = Date.now();
        console.log(`💊 Fetching drug information for: ${query.drugName}`);
        
        result.drugInformation = await getEnhancedDrugInfo(query.drugName, query.sessionId);
        
        const drugTime = Date.now() - drugStartTime;
        sourceResponseTimes['drug-info'] = drugTime;
        
        if (result.drugInformation) {
          sources.push('BrightData', 'TigerData');
          console.log(`✅ Drug information retrieved in ${drugTime}ms`);
        }
      } catch (error) {
        const errorMsg = `Drug information fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error('❌', errorMsg);
      }
    }

    // Analyze symptoms if provided
    if (query.symptoms && query.symptoms.length > 0) {
      try {
        const symptomStartTime = Date.now();
        console.log(`🩺 Analyzing symptoms:`, query.symptoms);
        
        result.symptomAnalysis = await analyzeSymptomsWithTigerData(
          query.symptoms,
          query.patientInfo,
          query.sessionId
        );
        
        const symptomTime = Date.now() - symptomStartTime;
        sourceResponseTimes['symptom-analysis'] = symptomTime;
        
        if (result.symptomAnalysis?.success) {
          sources.push('TigerData-Symptoms');
          console.log(`✅ Symptom analysis completed in ${symptomTime}ms`);
        }
      } catch (error) {
        const errorMsg = `Symptom analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error('❌', errorMsg);
      }
    }

    // Get market research if requested
    if (query.marketQuery) {
      try {
        const marketStartTime = Date.now();
        console.log(`📊 Fetching market research for: ${query.marketQuery}`);
        
        result.marketResearch = await getTigerDataMarketResearch(
          query.marketQuery,
          { industry: 'healthcare' },
          query.sessionId
        );
        
        const marketTime = Date.now() - marketStartTime;
        sourceResponseTimes['market-research'] = marketTime;
        
        if (result.marketResearch?.success) {
          sources.push('TigerData-Market');
          console.log(`✅ Market research completed in ${marketTime}ms`);
        }
      } catch (error) {
        const errorMsg = `Market research failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error('❌', errorMsg);
      }
    }

    // Calculate data quality metrics
    const totalTime = Date.now() - startTime;
    const uniqueSources = [...new Set(sources)];
    const reliability = this.calculateReliability(uniqueSources, errors);
    const completeness = this.calculateCompleteness(result, query);

    // Update result with performance and quality metrics
    result.dataQuality = {
      sources: uniqueSources,
      reliability,
      completeness,
      lastUpdated: new Date()
    };

    result.performance = {
      totalTime,
      sourceResponseTimes,
      cacheHits,
      errors
    };

    console.log(`🎯 Health data integration completed in ${totalTime}ms`, {
      sources: uniqueSources.length,
      reliability: `${reliability}%`,
      completeness: `${completeness}%`,
      errors: errors.length
    });

    return result;
  }

  /**
   * Test all data sources connectivity
   */
  async testConnectivity(): Promise<{
    brightData: { status: 'connected' | 'failed'; responseTime?: number; error?: string };
    tigerData: { status: 'connected' | 'failed'; responseTime?: number; error?: string };
    overall: { status: 'healthy' | 'degraded' | 'failed'; activeServices: number };
  }> {
    console.log('🔍 Testing data source connectivity...');
    
    const results = {
      brightData: { status: 'failed' as 'connected' | 'failed', responseTime: undefined as number | undefined, error: undefined as string | undefined },
      tigerData: { status: 'failed' as 'connected' | 'failed', responseTime: undefined as number | undefined, error: undefined as string | undefined },
      overall: { status: 'failed' as 'healthy' | 'degraded' | 'failed', activeServices: 0 }
    };

    // Test BrightData
    try {
      const brightStartTime = Date.now();
      await this.brightDataService.getComprehensiveDrugInfo('aspirin');
      results.brightData = {
        status: 'connected',
        responseTime: Date.now() - brightStartTime,
        error: undefined
      };
      results.overall.activeServices++;
    } catch (error) {
      results.brightData.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Test TigerData
    try {
      const tigerStartTime = Date.now();
      const tigerResponse = await this.tigerDataService.getDrugInformation('aspirin');
      if (tigerResponse.success) {
        results.tigerData = {
          status: 'connected',
          responseTime: Date.now() - tigerStartTime,
          error: undefined
        };
        results.overall.activeServices++;
      } else {
        results.tigerData.error = tigerResponse.error || 'Unknown error';
      }
    } catch (error) {
      results.tigerData.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Determine overall status
    if (results.overall.activeServices === 2) {
      results.overall.status = 'healthy';
    } else if (results.overall.activeServices === 1) {
      results.overall.status = 'degraded';
    } else {
      results.overall.status = 'failed';
    }

    console.log('📊 Connectivity test results:', results);
    return results;
  }

  /**
   * Get comprehensive service statistics
   */
  getServiceStatistics() {
    const comprehensiveStats = this.comprehensiveDrugService.getServiceStats();
    const tigerStats = this.tigerDataService.getStats();
    const brightStats = this.brightDataService.getCacheStats();

    return {
      comprehensive: comprehensiveStats,
      tigerData: tigerStats,
      brightData: brightStats,
      integration: {
        config: this.config,
        timestamp: new Date()
      }
    };
  }

  /**
   * Clear all service caches
   */
  clearAllCaches() {
    this.comprehensiveDrugService.clearCaches();
    console.log('🧹 All integration service caches cleared');
  }

  /**
   * Calculate reliability score based on successful sources and errors
   */
  private calculateReliability(sources: string[], errors: string[]): number {
    const totalSources = Math.max(sources.length, 1);
    const errorPenalty = errors.length * 10;
    const baseScore = (sources.length / totalSources) * 100;
    return Math.max(0, Math.min(100, baseScore - errorPenalty));
  }

  /**
   * Calculate completeness score based on requested vs received data
   */
  private calculateCompleteness(result: IntegratedHealthData, query: any): number {
    let requested = 0;
    let received = 0;

    if (query.drugName) {
      requested++;
      if (result.drugInformation) received++;
    }

    if (query.symptoms?.length > 0) {
      requested++;
      if (result.symptomAnalysis?.success) received++;
    }

    if (query.marketQuery) {
      requested++;
      if (result.marketResearch?.success) received++;
    }

    return requested > 0 ? (received / requested) * 100 : 100;
  }
}

// Singleton instance
let dataIntegrationService: DataIntegrationService | null = null;

/**
 * Get or create data integration service instance
 */
export function getDataIntegrationService(config?: Partial<DataIntegrationConfig>): DataIntegrationService {
  if (!dataIntegrationService) {
    dataIntegrationService = new DataIntegrationService(config);
  }
  return dataIntegrationService;
}

/**
 * Quick function to get integrated health data
 */
export async function getIntegratedHealthData(query: {
  drugName?: string;
  symptoms?: string[];
  marketQuery?: string;
  patientInfo?: { age?: number; gender?: string; medicalHistory?: string[] };
  sessionId?: string;
}): Promise<IntegratedHealthData> {
  const service = getDataIntegrationService();
  return await service.getHealthData(query);
}

export default DataIntegrationService;
