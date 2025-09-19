/**
 * Redis Monitoring Dashboard Component
 *
 * Provides real-time monitoring of Redis cache performance, health, and metrics
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  BarChart3,
  Database,
  Zap,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Flame,
  RefreshCcw,
  Monitor,
  Server
} from 'lucide-react';
import { sessionCacheService } from '@/lib/services/sessionCacheService';

interface CacheMetrics {
  cache_health: {
    status: string;
    version: string;
    connected_clients: number;
    used_memory: string;
    keyspace: Record<string, any>;
    cache_statistics: any;
  };
  statistics: {
    cache_categories: Record<string, {
      count: number;
      sample_keys: string[];
    }>;
    total_keys: number;
    memory_usage: string;
  };
  performance_metrics: {
    ocr_cache_hits: number;
    ocr_cache_misses: number;
    analysis_cache_hits: number;
    analysis_cache_misses: number;
  };
  timestamp: string;
}

const RedisMonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Fetch cache health and metrics
  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const healthData = await sessionCacheService.getCacheHealth();

      if (healthData) {
        setMetrics(healthData);
        setLastUpdate(new Date());
        console.log('📊 Redis monitoring data updated:', healthData);
      } else {
        throw new Error('No metrics data received');
      }
    } catch (error) {
      console.error('Failed to fetch Redis metrics:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh metrics
  useEffect(() => {
    fetchMetrics();

    let intervalId: NodeJS.Timeout | null = null;

    if (isAutoRefresh) {
      intervalId = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAutoRefresh]);

  // Calculate cache hit rates
  const calculateHitRate = (hits: number, misses: number) => {
    const total = hits + misses;
    return total > 0 ? ((hits / total) * 100).toFixed(1) : '0';
  };

  // Warm cache handler
  const handleWarmCache = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/cache/warm-cache', {
        method: 'POST'
      });

      if (response.ok) {
        console.log('🔥 Cache warmed successfully');
        await fetchMetrics(); // Refresh metrics
      }
    } catch (error) {
      console.error('Failed to warm cache:', error);
    }
  };

  // Clear cache handler
  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear all cache data? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/v1/cache/clear-all', {
        method: 'DELETE'
      });

      if (response.ok) {
        console.log('🧹 Cache cleared successfully');
        await fetchMetrics(); // Refresh metrics
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'connected':
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'disconnected':
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'connected':
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />;
      case 'disconnected':
      case 'error':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  if (isLoading && !metrics) {
    return (
      <Card className="glass-card p-6">
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span>Loading Redis monitoring data...</span>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card p-6 bg-red-50 border-red-200">
        <div className="flex items-center gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Redis Monitoring Error</p>
            <p className="text-sm mt-1">{error}</p>
            <Button
              onClick={fetchMetrics}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              <RefreshCcw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Monitor className="w-6 h-6 text-primary" />
            Redis Cache Monitoring
          </h2>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              variant={isAutoRefresh ? "default" : "outline"}
              size="sm"
            >
              <RefreshCcw className={`w-3 h-3 mr-1 ${isAutoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh
            </Button>
            <Button
              onClick={fetchMetrics}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCcw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {lastUpdate && (
          <p className="text-sm text-muted-foreground mb-4">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}

        {/* Connection Status */}
        {metrics?.cache_health && (
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor(metrics.cache_health.status)}`}>
            {getStatusIcon(metrics.cache_health.status)}
            <span className="font-medium">
              Redis {metrics.cache_health.status || 'Unknown'}
              {metrics.cache_health.version && ` (v${metrics.cache_health.version})`}
            </span>
          </div>
        )}
      </Card>

      {/* Performance Metrics */}
      {metrics?.performance_metrics && (
        <Card className="glass-card p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Cache Performance
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OCR Cache Performance */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                OCR Cache Performance
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Cache Hits:</span>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    {metrics.performance_metrics.ocr_cache_hits}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Cache Misses:</span>
                  <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                    {metrics.performance_metrics.ocr_cache_misses}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-700">Hit Rate:</span>
                  <Badge variant="default" className="bg-blue-600">
                    {calculateHitRate(
                      metrics.performance_metrics.ocr_cache_hits,
                      metrics.performance_metrics.ocr_cache_misses
                    )}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* Analysis Cache Performance */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Analysis Cache Performance
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-700">Cache Hits:</span>
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                    {metrics.performance_metrics.analysis_cache_hits}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-700">Cache Misses:</span>
                  <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                    {metrics.performance_metrics.analysis_cache_misses}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-700">Hit Rate:</span>
                  <Badge variant="default" className="bg-purple-600">
                    {calculateHitRate(
                      metrics.performance_metrics.analysis_cache_hits,
                      metrics.performance_metrics.analysis_cache_misses
                    )}%
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Cache Statistics */}
      {metrics?.statistics && (
        <Card className="glass-card p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Cache Statistics
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 glass-panel rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {metrics.statistics.total_keys}
              </div>
              <div className="text-sm text-muted-foreground">Total Cache Keys</div>
            </div>
            <div className="text-center p-4 glass-panel rounded-lg">
              <div className="text-2xl font-bold text-success mb-1">
                {metrics.cache_health?.connected_clients || 0}
              </div>
              <div className="text-sm text-muted-foreground">Connected Clients</div>
            </div>
            <div className="text-center p-4 glass-panel rounded-lg">
              <div className="text-2xl font-bold text-accent mb-1">
                {metrics.cache_health?.used_memory || 'N/A'}
              </div>
              <div className="text-sm text-muted-foreground">Memory Usage</div>
            </div>
          </div>

          {/* Cache Categories */}
          <h4 className="font-semibold mb-3">Cache Categories</h4>
          <div className="space-y-3">
            {Object.entries(metrics.statistics.cache_categories).map(([category, data]) => (
              <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium capitalize">{category.replace('_', ' ')}</span>
                  {data.sample_keys.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Sample keys: {data.sample_keys.slice(0, 2).join(', ')}
                      {data.sample_keys.length > 2 && '...'}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="ml-2">
                  {data.count} keys
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Cache Management */}
      <Card className="glass-card p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-primary" />
          Cache Management
        </h3>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleWarmCache}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Flame className="w-4 h-4" />
            Warm Cache
          </Button>
          <Button
            onClick={handleClearCache}
            variant="outline"
            className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Cache
          </Button>
        </div>

        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-700">
              <p className="font-medium">Cache Management Notice</p>
              <p className="mt-1">
                • Warming cache pre-loads common medications for better performance
              </p>
              <p>
                • Clearing cache will remove all cached data and may impact performance temporarily
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RedisMonitoringDashboard;