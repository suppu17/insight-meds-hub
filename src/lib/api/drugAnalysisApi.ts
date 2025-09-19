import { sessionCacheService } from '@/lib/services/sessionCacheService';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface DrugAnalysisRequest {
  drug_name: string;
  analysis_type: 'overview' | 'market_research' | 'clinical_trials' | 'competitive_analysis' | 'safety_profile' | 'pricing_analysis';
  include_competitors?: boolean;
  include_market_data?: boolean;
  include_clinical_data?: boolean;
}

export interface AnalysisProgress {
  analysis_id: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  progress_percentage: number;
  current_step: string;
  estimated_completion?: string;
  results?: any;
  message?: string;
  executive_summary?: string;
}

export interface MarketIntelligence {
  analysis_id: string;
  drug_name: string;
  market_region: string;
  status: string;
  message: string;
  includes: {
    competitors: boolean;
    pricing: boolean;
    regional_data: boolean;
  };
  estimated_completion_minutes: number;
}

export class DrugAnalysisAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async startDrugAnalysis(request: DrugAnalysisRequest): Promise<{analysis_id: string, status: string, message: string}> {
    try {
      // Generate cache key for this analysis request
      const cacheKey = `${request.drug_name.toLowerCase()}_${request.analysis_type}`;

      // Check for cached analysis result first
      console.log('🔍 Checking cache for analysis:', cacheKey);
      const cachedResult = await sessionCacheService.getCachedAnalysisResult(cacheKey);

      if (cachedResult) {
        console.log('📦 Using cached analysis result for:', request.drug_name);

        // Return cached result in the expected format
        return {
          analysis_id: cachedResult.id,
          status: 'completed',
          message: 'Analysis retrieved from cache',
          results: cachedResult.results,
          executive_summary: cachedResult.executiveSummary,
          cached: true
        } as any;
      }

      // Start analysis tracking in session cache
      const analysisId = await sessionCacheService.startAnalysis(request.drug_name);

      console.log('🚀 Starting new drug analysis:', request.drug_name);

      // Update progress - starting analysis
      await sessionCacheService.updateAnalysisProgress(analysisId, 'upload', 5);

      const response = await fetch(`${this.baseUrl}/drug/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...request,
          session_analysis_id: analysisId  // Include session tracking ID
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Update progress - analysis started
      await sessionCacheService.updateAnalysisProgress(analysisId, 'analysis', 10);

      return result;
    } catch (error) {
      console.error('Failed to start drug analysis:', error);
      throw error;
    }
  }

  async getAnalysisStatus(analysisId: string): Promise<AnalysisProgress> {
    try {
      const response = await fetch(`${this.baseUrl}/drug/analyze/${analysisId}/status`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Update session progress tracking
      if (result.progress_percentage) {
        await sessionCacheService.updateAnalysisProgress(
          analysisId,
          this.mapStatusToStep(result.status),
          result.progress_percentage,
          result.results
        );
      }

      // Cache completed analysis results
      if (result.status === 'completed' && result.results) {
        try {
          console.log('💾 Caching completed analysis result');

          // Extract drug name from analysis ID or use a fallback
          const drugName = result.drug_name || analysisId.split('_')[0] || 'unknown';
          const analysisType = result.analysis_type || 'overview';
          const cacheKey = `${drugName.toLowerCase()}_${analysisType}`;

          await sessionCacheService.cacheAnalysisResult(
            cacheKey,
            result.results,
            result.executive_summary,
            result.clinical_recommendations
          );

          console.log('✅ Analysis result cached successfully');
        } catch (cacheError) {
          console.warn('Failed to cache analysis result:', cacheError);
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to get analysis status:', error);
      throw error;
    }
  }

  // Helper method to map backend status to session cache steps
  private mapStatusToStep(status: string): 'upload' | 'ocr' | 'analysis' | 'results' | 'complete' {
    switch (status) {
      case 'queued': return 'upload';
      case 'in_progress': return 'analysis';
      case 'completed': return 'complete';
      case 'failed': return 'upload'; // Reset on failure
      default: return 'analysis';
    }
  }

  createAnalysisStream(analysisId: string): EventSource {
    const eventSource = new EventSource(`${this.baseUrl}/drug/analyze/${analysisId}/stream`);
    return eventSource;
  }

  async getBasicDrugInfo(drugName: string): Promise<any> {
    try {
      // Check cache for basic drug info
      const cacheKey = `${drugName.toLowerCase()}_basic_info`;
      const cachedInfo = await sessionCacheService.getCachedAnalysisResult(cacheKey);

      if (cachedInfo) {
        console.log('📦 Using cached basic drug info for:', drugName);
        return cachedInfo.results;
      }

      console.log('🔍 Fetching basic drug info for:', drugName);

      const response = await fetch(`${this.baseUrl}/drug/info/${encodeURIComponent(drugName)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Cache basic drug info for future use (longer TTL since it's mostly static)
      try {
        await sessionCacheService.cacheAnalysisResult(
          cacheKey,
          result,
          `Basic information for ${drugName}`,
          null
        );
        console.log('💾 Cached basic drug info for:', drugName);
      } catch (cacheError) {
        console.warn('Failed to cache basic drug info:', cacheError);
      }

      return result;
    } catch (error) {
      console.error('Failed to get drug info:', error);
      throw error;
    }
  }

  async compareDrugs(drugNames: string[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/drug/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(drugNames),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to compare drugs:', error);
      throw error;
    }
  }

  async searchDrugs(query: string, limit: number = 10): Promise<any> {
    try {
      const params = new URLSearchParams({
        query,
        limit: limit.toString()
      });

      const response = await fetch(`${this.baseUrl}/drug/search?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to search drugs:', error);
      throw error;
    }
  }

  // Market Research endpoints

  async getMarketIntelligence(
    drugName: string,
    options: {
      include_competitors?: boolean;
      include_pricing?: boolean;
      market_region?: string;
    } = {}
  ): Promise<MarketIntelligence> {
    try {
      const params = new URLSearchParams({
        include_competitors: (options.include_competitors ?? true).toString(),
        include_pricing: (options.include_pricing ?? true).toString(),
        market_region: options.market_region ?? 'global'
      });

      const response = await fetch(`${this.baseUrl}/market/intelligence/${encodeURIComponent(drugName)}?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get market intelligence:', error);
      throw error;
    }
  }

  async getCompetitorAnalysis(drugName: string, limit: number = 10): Promise<any> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      });

      const response = await fetch(`${this.baseUrl}/market/competitors/${encodeURIComponent(drugName)}?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get competitor analysis:', error);
      throw error;
    }
  }

  async getPricingAnalysis(drugName: string, regions: string[] = ['US', 'EU', 'Global']): Promise<any> {
    try {
      const params = new URLSearchParams();
      regions.forEach(region => params.append('regions', region));

      const response = await fetch(`${this.baseUrl}/market/pricing/${encodeURIComponent(drugName)}?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get pricing analysis:', error);
      throw error;
    }
  }

  async getMarketTrends(therapeuticArea?: string, timeframe: string = '12m'): Promise<any> {
    try {
      const params = new URLSearchParams({
        timeframe
      });

      if (therapeuticArea) {
        params.append('therapeutic_area', therapeuticArea);
      }

      const response = await fetch(`${this.baseUrl}/market/trends?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get market trends:', error);
      throw error;
    }
  }

  async startCustomMarketResearch(researchRequest: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/market/custom-research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(researchRequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to start custom market research:', error);
      throw error;
    }
  }

  async getMarketResearchReport(researchId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/market/reports/${researchId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get market research report:', error);
      throw error;
    }
  }

  createRealTimeMarketStream(drugName: string): EventSource {
    const eventSource = new EventSource(`${this.baseUrl}/market/real-time/${encodeURIComponent(drugName)}`);
    return eventSource;
  }
}

// Create a default instance
export const drugAnalysisAPI = new DrugAnalysisAPI();