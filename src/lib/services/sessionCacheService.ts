/**
 * Frontend Session Cache Service
 *
 * Integrates with backend Redis caching for session persistence,
 * user preferences, and analysis progress tracking.
 */

interface SessionData {
  sessionId: string;
  userId?: string;
  createdAt: Date;
  lastActivity: Date;
  preferences: UserPreferences;
  currentAnalysis?: AnalysisProgress;
}

interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  voiceEnabled?: boolean;
  autoSaveResults?: boolean;
  defaultAnalysisMode?: 'comprehensive' | 'quick' | 'detailed';
}

interface AnalysisProgress {
  id: string;
  drugName?: string;
  extractedInfo?: any;
  step: 'upload' | 'ocr' | 'analysis' | 'results' | 'complete';
  startedAt: Date;
  estimatedCompletion?: Date;
  progress: number; // 0-100
}

interface CachedAnalysisResult {
  id: string;
  drugName: string;
  timestamp: Date;
  results: any;
  executiveSummary?: string;
  clinicalRecommendations?: any;
}

class SessionCacheService {
  private readonly API_BASE = 'http://localhost:8000/api/v1';
  private sessionId: string;
  private sessionData: SessionData | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeSession();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private async initializeSession(): Promise<void> {
    try {
      // Try to restore session from backend cache
      const cachedSession = await this.getSessionFromBackend();

      if (cachedSession) {
        this.sessionData = cachedSession;
        console.log('🔄 Session restored from cache:', this.sessionId);
      } else {
        // Create new session
        this.sessionData = {
          sessionId: this.sessionId,
          createdAt: new Date(),
          lastActivity: new Date(),
          preferences: this.getDefaultPreferences()
        };
        await this.saveSessionToBackend();
        console.log('🆕 New session created:', this.sessionId);
      }
    } catch (error) {
      console.warn('⚠️ Session cache unavailable, using local storage fallback:', error);
      this.initializeLocalSession();
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'system',
      language: 'en',
      voiceEnabled: true,
      autoSaveResults: true,
      defaultAnalysisMode: 'comprehensive'
    };
  }

  private initializeLocalSession(): void {
    // Fallback to localStorage when backend cache is unavailable
    const stored = localStorage.getItem('medinsight_session');
    if (stored) {
      try {
        this.sessionData = JSON.parse(stored);
        console.log('📱 Session restored from localStorage');
      } catch (error) {
        console.warn('Invalid localStorage session data, creating new session');
        this.createNewLocalSession();
      }
    } else {
      this.createNewLocalSession();
    }
  }

  private createNewLocalSession(): void {
    this.sessionData = {
      sessionId: this.sessionId,
      createdAt: new Date(),
      lastActivity: new Date(),
      preferences: this.getDefaultPreferences()
    };
    this.saveToLocalStorage();
  }

  private saveToLocalStorage(): void {
    if (this.sessionData) {
      localStorage.setItem('medinsight_session', JSON.stringify(this.sessionData));
    }
  }

  private async getSessionFromBackend(): Promise<SessionData | null> {
    try {
      const response = await fetch(`${this.API_BASE}/cache/session/${this.sessionId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        return data.session_data;
      }
      return null;
    } catch (error) {
      console.warn('Failed to get session from backend:', error);
      return null;
    }
  }

  private async saveSessionToBackend(): Promise<void> {
    if (!this.sessionData) return;

    try {
      await fetch(`${this.API_BASE}/cache/session/${this.sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_data: this.sessionData,
          ttl: 1800 // 30 minutes
        })
      });
      console.log('💾 Session saved to backend cache');
    } catch (error) {
      console.warn('Failed to save session to backend, using localStorage:', error);
      this.saveToLocalStorage();
    }
  }

  // Public API Methods

  public getSessionId(): string {
    return this.sessionId;
  }

  public getSessionData(): SessionData | null {
    return this.sessionData;
  }

  public async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    if (!this.sessionData) return;

    this.sessionData.preferences = { ...this.sessionData.preferences, ...preferences };
    this.sessionData.lastActivity = new Date();

    await this.saveSessionToBackend();
    console.log('✅ User preferences updated:', preferences);
  }

  public async startAnalysis(drugName: string): Promise<string> {
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const analysisProgress: AnalysisProgress = {
      id: analysisId,
      drugName,
      step: 'upload',
      startedAt: new Date(),
      progress: 0
    };

    if (this.sessionData) {
      this.sessionData.currentAnalysis = analysisProgress;
      this.sessionData.lastActivity = new Date();
      await this.saveSessionToBackend();
    }

    // Also cache analysis progress separately for real-time updates
    await this.cacheAnalysisProgress(analysisId, analysisProgress);

    console.log('🚀 Analysis started:', analysisId);
    return analysisId;
  }

  public async updateAnalysisProgress(
    analysisId: string,
    step: AnalysisProgress['step'],
    progress: number,
    extractedInfo?: any
  ): Promise<void> {
    try {
      const progressData: Partial<AnalysisProgress> = {
        step,
        progress,
        extractedInfo
      };

      // Update session data
      if (this.sessionData?.currentAnalysis?.id === analysisId) {
        this.sessionData.currentAnalysis = {
          ...this.sessionData.currentAnalysis,
          ...progressData
        };
        this.sessionData.lastActivity = new Date();
        await this.saveSessionToBackend();
      }

      // Update analysis progress cache
      await this.cacheAnalysisProgress(analysisId, progressData);

      console.log(`📊 Analysis progress updated: ${analysisId} - ${step} (${progress}%)`);
    } catch (error) {
      console.warn('Failed to update analysis progress:', error);
    }
  }

  private async cacheAnalysisProgress(analysisId: string, progressData: Partial<AnalysisProgress>): Promise<void> {
    try {
      await fetch(`${this.API_BASE}/cache/analysis-progress/${analysisId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress_data: progressData,
          ttl: 300 // 5 minutes
        })
      });
    } catch (error) {
      console.warn('Failed to cache analysis progress:', error);
    }
  }

  public async getAnalysisProgress(analysisId: string): Promise<AnalysisProgress | null> {
    try {
      const response = await fetch(`${this.API_BASE}/cache/analysis-progress/${analysisId}`);
      if (response.ok) {
        const data = await response.json();
        return data.progress_data;
      }
      return null;
    } catch (error) {
      console.warn('Failed to get analysis progress:', error);
      return null;
    }
  }

  public async cacheAnalysisResult(
    drugName: string,
    results: any,
    executiveSummary?: string,
    clinicalRecommendations?: any
  ): Promise<void> {
    const cachedResult: CachedAnalysisResult = {
      id: `result_${Date.now()}`,
      drugName,
      timestamp: new Date(),
      results,
      executiveSummary,
      clinicalRecommendations
    };

    try {
      await fetch(`${this.API_BASE}/cache/analysis-result/${drugName.toLowerCase()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result_data: cachedResult,
          ttl: 7200 // 2 hours
        })
      });
      console.log('💾 Analysis result cached for:', drugName);
    } catch (error) {
      console.warn('Failed to cache analysis result:', error);
    }
  }

  public async getCachedAnalysisResult(drugName: string): Promise<CachedAnalysisResult | null> {
    try {
      const response = await fetch(`${this.API_BASE}/cache/analysis-result/${drugName.toLowerCase()}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Analysis result cache hit for:', drugName);
        return data.result_data;
      }
      return null;
    } catch (error) {
      console.warn('Failed to get cached analysis result:', error);
      return null;
    }
  }

  public async extendSession(): Promise<void> {
    if (this.sessionData) {
      this.sessionData.lastActivity = new Date();
      await this.saveSessionToBackend();
    }
  }

  public async clearSession(): Promise<void> {
    try {
      await fetch(`${this.API_BASE}/cache/session/${this.sessionId}`, {
        method: 'DELETE'
      });
      console.log('🗑️ Session cleared from backend cache');
    } catch (error) {
      console.warn('Failed to clear backend session:', error);
    }

    // Clear localStorage
    localStorage.removeItem('medinsight_session');
    this.sessionData = null;
    console.log('🧹 Session cleared');
  }

  // Health monitoring
  public async getCacheHealth(): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE}/cache/health`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.warn('Failed to get cache health:', error);
      return null;
    }
  }
}

// Export singleton instance
export const sessionCacheService = new SessionCacheService();
export type { SessionData, UserPreferences, AnalysisProgress, CachedAnalysisResult };