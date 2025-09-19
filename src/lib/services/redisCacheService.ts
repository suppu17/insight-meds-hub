/**
 * Frontend Redis Cache Service
 * 
 * Enhanced caching service that works with the backend Redis implementation.
 * Provides additional frontend-specific caching utilities and monitoring.
 */

interface CacheHealthStatus {
  status: 'connected' | 'disconnected' | 'error';
  version?: string;
  connected_clients?: number;
  used_memory?: string;
  cache_statistics?: any;
  error?: string;
}

interface CacheStatistics {
  cache_categories: Record<string, { count: number; sample_keys: string[] }>;
  total_keys: number;
  memory_usage: string;
  performance_metrics?: Record<string, number>;
}

class RedisCacheService {
  private readonly API_BASE = 'http://localhost:8000/api/v1';
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isHealthy = false;

  constructor() {
    this.startHealthMonitoring();
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getCacheHealth();
        this.isHealthy = health?.status === 'connected';
      } catch (error) {
        this.isHealthy = false;
        console.warn('Redis health check failed:', error);
      }
    }, 30000);

    // Initial health check
    this.getCacheHealth().then(health => {
      this.isHealthy = health?.status === 'connected';
    }).catch(() => {
      this.isHealthy = false;
    });
  }

  /**
   * Stop health monitoring
   */
  public stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Check if Redis is currently healthy
   */
  public isRedisHealthy(): boolean {
    return this.isHealthy;
  }

  /**
   * Get comprehensive cache health status
   */
  public async getCacheHealth(): Promise<CacheHealthStatus | null> {
    try {
      const response = await fetch(`${this.API_BASE}/cache/health`);
      if (response.ok) {
        const data = await response.json();
        return data.cache_health;
      }
      return null;
    } catch (error) {
      console.warn('Failed to get cache health:', error);
      return null;
    }
  }

  /**
   * Get detailed cache statistics
   */
  public async getCacheStatistics(): Promise<CacheStatistics | null> {
    try {
      const response = await fetch(`${this.API_BASE}/cache/stats`);
      if (response.ok) {
        const data = await response.json();
        return data.cache_statistics;
      }
      return null;
    } catch (error) {
      console.warn('Failed to get cache statistics:', error);
      return null;
    }
  }

  /**
   * Cache session data with enhanced error handling
   */
  public async cacheSessionData(sessionId: string, sessionData: any, ttl: number = 1800): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/cache/session/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_data: sessionData,
          ttl
        })
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.warn('Failed to cache session data:', error);
      return false;
    }
  }

  /**
   * Get cached session data
   */
  public async getSessionData(sessionId: string): Promise<any | null> {
    try {
      const response = await fetch(`${this.API_BASE}/cache/session/${sessionId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data.session_data;
      }
      return null;
    } catch (error) {
      console.warn('Failed to get session data:', error);
      return null;
    }
  }

  /**
   * Clear session data
   */
  public async clearSessionData(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/cache/session/${sessionId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.warn('Failed to clear session data:', error);
      return false;
    }
  }

  /**
   * Cache analysis progress
   */
  public async cacheAnalysisProgress(analysisId: string, progressData: any, ttl: number = 300): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/cache/analysis-progress/${analysisId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress_data: progressData,
          ttl
        })
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.warn('Failed to cache analysis progress:', error);
      return false;
    }
  }

  /**
   * Get analysis progress
   */
  public async getAnalysisProgress(analysisId: string): Promise<any | null> {
    try {
      const response = await fetch(`${this.API_BASE}/cache/analysis-progress/${analysisId}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data.progress_data;
      }
      return null;
    } catch (error) {
      console.warn('Failed to get analysis progress:', error);
      return null;
    }
  }

  /**
   * Cache analysis result
   */
  public async cacheAnalysisResult(drugName: string, resultData: any, ttl: number = 7200): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/cache/analysis-result/${encodeURIComponent(drugName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          result_data: resultData,
          ttl
        })
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.warn('Failed to cache analysis result:', error);
      return false;
    }
  }

  /**
   * Get cached analysis result
   */
  public async getCachedAnalysisResult(drugName: string): Promise<any | null> {
    try {
      const response = await fetch(`${this.API_BASE}/cache/analysis-result/${encodeURIComponent(drugName)}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        return result.data.result_data;
      }
      return null;
    } catch (error) {
      console.warn('Failed to get cached analysis result:', error);
      return null;
    }
  }

  /**
   * Warm cache with commonly used data
   */
  public async warmCache(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/cache/warm-cache`, {
        method: 'POST'
      });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.warn('Failed to warm cache:', error);
      return false;
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  public async clearAllCache(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/cache/clear-all`, {
        method: 'DELETE'
      });
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.warn('Failed to clear all cache:', error);
      return false;
    }
  }

  /**
   * Enhanced caching with automatic retry and fallback
   */
  public async cacheWithRetry<T>(
    key: string,
    dataFetcher: () => Promise<T>,
    cacheMethod: (data: T) => Promise<boolean>,
    getCacheMethod: () => Promise<T | null>,
    maxRetries: number = 3
  ): Promise<T> {
    // Try to get from cache first
    try {
      const cached = await getCacheMethod();
      if (cached !== null) {
        console.log(`Cache hit for: ${key}`);
        return cached;
      }
    } catch (error) {
      console.warn(`Cache get failed for ${key}:`, error);
    }

    // Cache miss - fetch data
    console.log(`Cache miss for: ${key}, fetching data`);
    const data = await dataFetcher();

    // Try to cache the result with retry
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const success = await cacheMethod(data);
        if (success) {
          console.log(`Cached successfully: ${key}`);
          break;
        }
      } catch (error) {
        console.warn(`Cache attempt ${attempt} failed for ${key}:`, error);
        if (attempt === maxRetries) {
          console.warn(`All cache attempts failed for ${key}, continuing without cache`);
        }
      }
    }

    return data;
  }

  /**
   * Get cache performance metrics
   */
  public async getPerformanceMetrics(): Promise<Record<string, number> | null> {
    try {
      const stats = await this.getCacheStatistics();
      return stats?.performance_metrics || null;
    } catch (error) {
      console.warn('Failed to get performance metrics:', error);
      return null;
    }
  }

  /**
   * Monitor cache hit rate
   */
  public async getCacheHitRate(): Promise<{ hitRate: number; totalRequests: number } | null> {
    try {
      const metrics = await this.getPerformanceMetrics();
      if (!metrics) return null;

      const hits = (metrics.analysis_cache_hits || 0) + (metrics.ocr_cache_hits || 0);
      const misses = (metrics.analysis_cache_misses || 0) + (metrics.ocr_cache_misses || 0);
      const total = hits + misses;

      return {
        hitRate: total > 0 ? (hits / total) * 100 : 0,
        totalRequests: total
      };
    } catch (error) {
      console.warn('Failed to calculate cache hit rate:', error);
      return null;
    }
  }
}

// Export singleton instance
export const redisCacheService = new RedisCacheService();

// Export types
export type { CacheHealthStatus, CacheStatistics };
