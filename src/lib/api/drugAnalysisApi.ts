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
      const response = await fetch(`${this.baseUrl}/drug/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
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

      return await response.json();
    } catch (error) {
      console.error('Failed to get analysis status:', error);
      throw error;
    }
  }

  createAnalysisStream(analysisId: string): EventSource {
    const eventSource = new EventSource(`${this.baseUrl}/drug/analyze/${analysisId}/stream`);
    return eventSource;
  }

  async getBasicDrugInfo(drugName: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/drug/info/${encodeURIComponent(drugName)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
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