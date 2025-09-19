/**
 * React Hook for Redis Operations
 * Provides easy access to Redis storage for symptom logs and media files
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createRedisService, type RedisService, type SymptomEntry, type MediaFile } from '@/lib/services/redisService';

interface UseRedisOptions {
  userId?: string;
  autoConnect?: boolean;
}

interface UseRedisReturn {
  // Connection status
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Connection methods
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Symptom operations
  saveSymptom: (entry: Omit<SymptomEntry, 'id'>) => Promise<boolean>;
  getSymptoms: () => Promise<SymptomEntry[]>;
  deleteSymptom: (entryId: string) => Promise<boolean>;
  
  // Media operations
  saveMedia: (file: Omit<MediaFile, 'id'>) => Promise<boolean>;
  getMedia: (type?: 'video' | 'image') => Promise<MediaFile[]>;
  deleteMedia: (fileId: string) => Promise<boolean>;
  
  // Utility operations
  clearAllData: () => Promise<boolean>;
  getStorageStats: () => Promise<{
    symptomCount: number;
    videoCount: number;
    imageCount: number;
    totalSize: number;
  }>;
  
  // Cache management
  refreshCache: () => Promise<void>;
  
  // Data synchronization
  syncToRedis: () => Promise<{ synced: number; failed: number }>;
  getPendingSyncCount: () => number;
  
  // Data backup and recovery
  backupCriticalData: (data: any, identifier: string) => Promise<boolean>;
  recoverCriticalData: (identifier: string) => any | null;
}

export const useRedis = (options: UseRedisOptions = {}): UseRedisReturn => {
  const { userId = 'anonymous', autoConnect = true } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache for frequently accessed data
  const [symptomsCache, setSymptomsCache] = useState<SymptomEntry[]>([]);
  const [mediaCache, setMediaCache] = useState<MediaFile[]>([]);
  const [cacheTimestamp, setCacheTimestamp] = useState<number>(0);
  
  const redisServiceRef = useRef<RedisService | null>(null);
  
  // Initialize Redis service
  useEffect(() => {
    if (!redisServiceRef.current) {
      redisServiceRef.current = createRedisService();
    }
    
    if (autoConnect) {
      connect();
    }
    
    return () => {
      if (redisServiceRef.current) {
        redisServiceRef.current.disconnect();
      }
    };
  }, [autoConnect]);

  // Connection methods
  const connect = useCallback(async () => {
    if (!redisServiceRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await redisServiceRef.current.connect();
      setIsConnected(redisServiceRef.current.isRedisConnected());
      
      // Load initial data
      await refreshCache();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (!redisServiceRef.current) return;
    
    try {
      await redisServiceRef.current.disconnect();
      setIsConnected(false);
      setSymptomsCache([]);
      setMediaCache([]);
      setCacheTimestamp(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed');
    }
  }, []);

  // Cache management
  const refreshCache = useCallback(async () => {
    if (!redisServiceRef.current || !isConnected) return;
    
    try {
      const [symptoms, media] = await Promise.all([
        redisServiceRef.current.getUserSymptomEntries(userId),
        redisServiceRef.current.getUserMediaFiles(userId),
      ]);
      
      setSymptomsCache(symptoms);
      setMediaCache(media);
      setCacheTimestamp(Date.now());
    } catch (err) {
      console.error('Failed to refresh cache:', err);
    }
  }, [userId, isConnected]);

  // Check if cache is stale (older than 5 minutes)
  const isCacheStale = useCallback(() => {
    return Date.now() - cacheTimestamp > 5 * 60 * 1000;
  }, [cacheTimestamp]);

  // Symptom operations
  const saveSymptom = useCallback(async (entry: Omit<SymptomEntry, 'id'>): Promise<boolean> => {
    if (!redisServiceRef.current) return false;
    
    setError(null);
    
    try {
      const symptomEntry: SymptomEntry = {
        ...entry,
        id: `symptom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
      };
      
      const success = await redisServiceRef.current.saveSymptomEntry(symptomEntry);
      
      if (success) {
        // Update cache
        setSymptomsCache(prev => [symptomEntry, ...prev]);
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save symptom');
      return false;
    }
  }, [userId]);

  const getSymptoms = useCallback(async (): Promise<SymptomEntry[]> => {
    if (!redisServiceRef.current) return [];
    
    // Return cached data if fresh
    if (!isCacheStale() && symptomsCache.length > 0) {
      return symptomsCache;
    }
    
    try {
      const symptoms = await redisServiceRef.current.getUserSymptomEntries(userId);
      setSymptomsCache(symptoms);
      setCacheTimestamp(Date.now());
      return symptoms;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get symptoms');
      return symptomsCache; // Return cached data as fallback
    }
  }, [userId, symptomsCache, isCacheStale]);

  const deleteSymptom = useCallback(async (entryId: string): Promise<boolean> => {
    if (!redisServiceRef.current) return false;
    
    setError(null);
    
    try {
      const success = await redisServiceRef.current.deleteSymptomEntry(userId, entryId);
      
      if (success) {
        // Update cache
        setSymptomsCache(prev => prev.filter(entry => entry.id !== entryId));
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete symptom');
      return false;
    }
  }, [userId]);

  // Media operations
  const saveMedia = useCallback(async (file: Omit<MediaFile, 'id'>): Promise<boolean> => {
    if (!redisServiceRef.current) return false;
    
    setError(null);
    
    try {
      const mediaFile: MediaFile = {
        ...file,
        id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
      };
      
      const success = await redisServiceRef.current.saveMediaFile(mediaFile);
      
      if (success) {
        // Update cache
        setMediaCache(prev => [mediaFile, ...prev]);
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save media');
      return false;
    }
  }, [userId]);

  const getMedia = useCallback(async (type?: 'video' | 'image'): Promise<MediaFile[]> => {
    if (!redisServiceRef.current) return [];
    
    // Return cached data if fresh
    if (!isCacheStale() && mediaCache.length > 0) {
      const filteredCache = type ? mediaCache.filter(file => file.type === type) : mediaCache;
      return filteredCache;
    }
    
    try {
      const media = await redisServiceRef.current.getUserMediaFiles(userId, type);
      
      if (!type) {
        setMediaCache(media);
        setCacheTimestamp(Date.now());
      }
      
      return media;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get media');
      const filteredCache = type ? mediaCache.filter(file => file.type === type) : mediaCache;
      return filteredCache; // Return cached data as fallback
    }
  }, [userId, mediaCache, isCacheStale]);

  const deleteMedia = useCallback(async (fileId: string): Promise<boolean> => {
    if (!redisServiceRef.current) return false;
    
    setError(null);
    
    try {
      const success = await redisServiceRef.current.deleteMediaFile(userId, fileId);
      
      if (success) {
        // Update cache
        setMediaCache(prev => prev.filter(file => file.id !== fileId));
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete media');
      return false;
    }
  }, [userId]);

  // Utility operations
  const clearAllData = useCallback(async (): Promise<boolean> => {
    if (!redisServiceRef.current) return false;
    
    setError(null);
    
    try {
      const success = await redisServiceRef.current.clearUserData(userId);
      
      if (success) {
        // Clear cache
        setSymptomsCache([]);
        setMediaCache([]);
        setCacheTimestamp(0);
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear data');
      return false;
    }
  }, [userId]);

  const getStorageStats = useCallback(async () => {
    if (!redisServiceRef.current) {
      return {
        symptomCount: 0,
        videoCount: 0,
        imageCount: 0,
        totalSize: 0,
      };
    }
    
    try {
      return await redisServiceRef.current.getStorageStats(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get storage stats');
      return {
        symptomCount: symptomsCache.length,
        videoCount: mediaCache.filter(f => f.type === 'video').length,
        imageCount: mediaCache.filter(f => f.type === 'image').length,
        totalSize: mediaCache.reduce((sum, file) => sum + file.size, 0),
      };
    }
  }, [userId, symptomsCache, mediaCache]);

  // Data synchronization
  const syncToRedis = useCallback(async (): Promise<{ synced: number; failed: number }> => {
    if (!redisServiceRef.current) {
      return { synced: 0, failed: 0 };
    }
    
    try {
      const result = await redisServiceRef.current.syncLocalStorageToRedis();
      
      if (result.synced > 0) {
        // Refresh cache after successful sync
        await refreshCache();
      }
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
      return { synced: 0, failed: 0 };
    }
  }, [refreshCache]);

  const getPendingSyncCount = useCallback((): number => {
    if (!redisServiceRef.current) return 0;
    return redisServiceRef.current.getPendingSyncCount();
  }, []);

  // Data backup and recovery
  const backupCriticalData = useCallback(async (data: any, identifier: string): Promise<boolean> => {
    if (!redisServiceRef.current) return false;
    
    try {
      return await redisServiceRef.current.backupCriticalData(data, identifier);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backup failed');
      return false;
    }
  }, []);

  const recoverCriticalData = useCallback((identifier: string): any | null => {
    if (!redisServiceRef.current) return null;
    
    try {
      return redisServiceRef.current.recoverCriticalData(identifier);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recovery failed');
      return null;
    }
  }, []);

  // Auto-sync when Redis connection is restored
  useEffect(() => {
    const performAutoSync = async () => {
      if (isConnected && !isLoading) {
        const pendingCount = getPendingSyncCount();
        if (pendingCount > 0) {
          console.log(`🔄 Auto-syncing ${pendingCount} pending items to Redis...`);
          const result = await syncToRedis();
          if (result.synced > 0) {
            console.log(`✅ Auto-sync completed: ${result.synced} items synced, ${result.failed} failed`);
          }
        }
      }
    };

    // Delay auto-sync to ensure connection is stable
    const timer = setTimeout(performAutoSync, 2000);
    return () => clearTimeout(timer);
  }, [isConnected, isLoading, syncToRedis, getPendingSyncCount]);

  return {
    // Connection status
    isConnected,
    isLoading,
    error,
    
    // Connection methods
    connect,
    disconnect,
    
    // Symptom operations
    saveSymptom,
    getSymptoms,
    deleteSymptom,
    
    // Media operations
    saveMedia,
    getMedia,
    deleteMedia,
    
    // Utility operations
    clearAllData,
    getStorageStats,
    
    // Cache management
    refreshCache,
    
    // Data synchronization
    syncToRedis,
    getPendingSyncCount,
    
    // Data backup and recovery
    backupCriticalData,
    recoverCriticalData,
  };
};
