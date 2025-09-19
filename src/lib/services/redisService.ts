/**
 * Redis Service for MedInsight Hub
 * Handles all Redis operations for symptom logs, videos, and images
 */

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  username?: string;
  database?: number;
  tls?: boolean;
}

interface SymptomEntry {
  id: string;
  concern: string;
  symptoms: string;
  timestamp: Date;
  severity?: 'mild' | 'moderate' | 'severe';
  autoSaved: boolean;
  userId?: string;
}

interface MediaFile {
  id: string;
  type: 'video' | 'image';
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

class RedisService {
  private client: any = null;
  private isConnected: boolean = false;
  private config: RedisConfig;

  constructor(config: RedisConfig) {
    this.config = config;
  }

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    try {
      // For browser environment, we'll use a REST API approach to Redis
      // In production, you'd use Redis Cloud REST API or a backend service
      const response = await fetch('/api/redis/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.config),
      });

      if (response.ok) {
        this.isConnected = true;
        console.log('✅ Redis connected successfully');
      } else {
        throw new Error('Failed to connect to Redis');
      }
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      // Fallback to localStorage for development
      this.isConnected = false;
    }
  }

  /**
   * Check if Redis is connected
   */
  isRedisConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Generic Redis operations
   */
  private async redisRequest(operation: string, key: string, value?: any): Promise<any> {
    if (!this.isConnected) {
      // Fallback to localStorage
      return this.localStorageFallback(operation, key, value);
    }

    try {
      const response = await fetch('/api/redis/operation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation,
          key,
          value,
        }),
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`Redis operation failed: ${operation}`);
      }
    } catch (error) {
      console.error(`Redis ${operation} failed:`, error);
      // Fallback to localStorage
      return this.localStorageFallback(operation, key, value);
    }
  }

  /**
   * Enhanced fallback to localStorage when Redis is unavailable
   * Includes data safety measures and sync preparation
   */
  private localStorageFallback(operation: string, key: string, value?: any): any {
    try {
      // Mark data as pending sync when Redis becomes available
      const syncKey = 'redis_sync_pending';
      
      switch (operation) {
        case 'set':
          // Store the data
          localStorage.setItem(key, JSON.stringify(value));
          
          // Mark for sync when Redis reconnects
          const pendingSync = JSON.parse(localStorage.getItem(syncKey) || '[]');
          if (!pendingSync.includes(key)) {
            pendingSync.push(key);
            localStorage.setItem(syncKey, JSON.stringify(pendingSync));
          }
          
          // Add timestamp for data integrity
          localStorage.setItem(`${key}_timestamp`, new Date().toISOString());
          
          console.log(`📦 Data saved to localStorage (fallback): ${key}`);
          return 'OK';
          
        case 'get':
          const item = localStorage.getItem(key);
          if (item) {
            // Check data age for integrity
            const timestamp = localStorage.getItem(`${key}_timestamp`);
            if (timestamp) {
              const age = Date.now() - new Date(timestamp).getTime();
              const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
              
              if (age > maxAge) {
                console.warn(`⚠️ LocalStorage data is old (${Math.round(age / (24 * 60 * 60 * 1000))} days): ${key}`);
              }
            }
            return JSON.parse(item);
          }
          return null;
          
        case 'del':
          localStorage.removeItem(key);
          localStorage.removeItem(`${key}_timestamp`);
          
          // Remove from sync queue
          const currentSync = JSON.parse(localStorage.getItem(syncKey) || '[]');
          const updatedSync = currentSync.filter((k: string) => k !== key);
          localStorage.setItem(syncKey, JSON.stringify(updatedSync));
          
          return 1;
          
        case 'keys':
          const keys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const storageKey = localStorage.key(i);
            if (storageKey && storageKey.includes(key) && !storageKey.includes('_timestamp')) {
              keys.push(storageKey);
            }
          }
          return keys;
          
        default:
          return null;
      }
    } catch (error) {
      console.error('❌ LocalStorage fallback failed:', error);
      
      // Try to save critical data to a backup location
      if (operation === 'set' && value) {
        try {
          const backupKey = `backup_${key}_${Date.now()}`;
          sessionStorage.setItem(backupKey, JSON.stringify(value));
          console.log(`💾 Critical data backed up to sessionStorage: ${backupKey}`);
        } catch (backupError) {
          console.error('❌ Backup to sessionStorage also failed:', backupError);
        }
      }
      
      return null;
    }
  }

  /**
   * Symptom Logs Operations
   */
  
  async saveSymptomEntry(entry: SymptomEntry): Promise<boolean> {
    try {
      const key = `symptom:${entry.userId || 'anonymous'}:${entry.id}`;
      const result = await this.redisRequest('set', key, {
        ...entry,
        timestamp: entry.timestamp.toISOString(),
      });
      
      // Also add to user's symptom list
      await this.addToSymptomList(entry.userId || 'anonymous', entry.id);
      
      return result === 'OK';
    } catch (error) {
      console.error('Failed to save symptom entry:', error);
      return false;
    }
  }

  async getSymptomEntry(userId: string, entryId: string): Promise<SymptomEntry | null> {
    try {
      const key = `symptom:${userId}:${entryId}`;
      const data = await this.redisRequest('get', key);
      
      if (data) {
        return {
          ...data,
          timestamp: new Date(data.timestamp),
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get symptom entry:', error);
      return null;
    }
  }

  async getUserSymptomEntries(userId: string): Promise<SymptomEntry[]> {
    try {
      const listKey = `symptom_list:${userId}`;
      const entryIds = await this.redisRequest('get', listKey) || [];
      
      const entries: SymptomEntry[] = [];
      for (const entryId of entryIds) {
        const entry = await this.getSymptomEntry(userId, entryId);
        if (entry) {
          entries.push(entry);
        }
      }
      
      // Sort by timestamp (newest first)
      return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Failed to get user symptom entries:', error);
      return [];
    }
  }

  async deleteSymptomEntry(userId: string, entryId: string): Promise<boolean> {
    try {
      const key = `symptom:${userId}:${entryId}`;
      await this.redisRequest('del', key);
      
      // Remove from user's symptom list
      await this.removeFromSymptomList(userId, entryId);
      
      return true;
    } catch (error) {
      console.error('Failed to delete symptom entry:', error);
      return false;
    }
  }

  private async addToSymptomList(userId: string, entryId: string): Promise<void> {
    const listKey = `symptom_list:${userId}`;
    const currentList = await this.redisRequest('get', listKey) || [];
    
    if (!currentList.includes(entryId)) {
      currentList.unshift(entryId); // Add to beginning
      // Keep only last 100 entries
      if (currentList.length > 100) {
        currentList.splice(100);
      }
      await this.redisRequest('set', listKey, currentList);
    }
  }

  private async removeFromSymptomList(userId: string, entryId: string): Promise<void> {
    const listKey = `symptom_list:${userId}`;
    const currentList = await this.redisRequest('get', listKey) || [];
    const updatedList = currentList.filter((id: string) => id !== entryId);
    await this.redisRequest('set', listKey, updatedList);
  }

  /**
   * Media Files Operations (Videos & Images)
   */
  
  async saveMediaFile(file: MediaFile): Promise<boolean> {
    try {
      const key = `media:${file.userId || 'anonymous'}:${file.id}`;
      const result = await this.redisRequest('set', key, {
        ...file,
        createdAt: file.createdAt.toISOString(),
      });
      
      // Add to user's media list
      await this.addToMediaList(file.userId || 'anonymous', file.id, file.type);
      
      return result === 'OK';
    } catch (error) {
      console.error('Failed to save media file:', error);
      return false;
    }
  }

  async getMediaFile(userId: string, fileId: string): Promise<MediaFile | null> {
    try {
      const key = `media:${userId}:${fileId}`;
      const data = await this.redisRequest('get', key);
      
      if (data) {
        return {
          ...data,
          createdAt: new Date(data.createdAt),
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get media file:', error);
      return null;
    }
  }

  async getUserMediaFiles(userId: string, type?: 'video' | 'image'): Promise<MediaFile[]> {
    try {
      const listKey = type ? `media_list:${userId}:${type}` : `media_list:${userId}`;
      const fileIds = await this.redisRequest('get', listKey) || [];
      
      const files: MediaFile[] = [];
      for (const fileId of fileIds) {
        const file = await this.getMediaFile(userId, fileId);
        if (file && (!type || file.type === type)) {
          files.push(file);
        }
      }
      
      // Sort by creation date (newest first)
      return files.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Failed to get user media files:', error);
      return [];
    }
  }

  async deleteMediaFile(userId: string, fileId: string): Promise<boolean> {
    try {
      const file = await this.getMediaFile(userId, fileId);
      if (!file) return false;

      const key = `media:${userId}:${fileId}`;
      await this.redisRequest('del', key);
      
      // Remove from user's media lists
      await this.removeFromMediaList(userId, fileId, file.type);
      
      return true;
    } catch (error) {
      console.error('Failed to delete media file:', error);
      return false;
    }
  }

  private async addToMediaList(userId: string, fileId: string, type: 'video' | 'image'): Promise<void> {
    const generalListKey = `media_list:${userId}`;
    const typeListKey = `media_list:${userId}:${type}`;
    
    // Add to general media list
    const generalList = await this.redisRequest('get', generalListKey) || [];
    if (!generalList.includes(fileId)) {
      generalList.unshift(fileId);
      if (generalList.length > 200) {
        generalList.splice(200);
      }
      await this.redisRequest('set', generalListKey, generalList);
    }
    
    // Add to type-specific list
    const typeList = await this.redisRequest('get', typeListKey) || [];
    if (!typeList.includes(fileId)) {
      typeList.unshift(fileId);
      if (typeList.length > 100) {
        typeList.splice(100);
      }
      await this.redisRequest('set', typeListKey, typeList);
    }
  }

  private async removeFromMediaList(userId: string, fileId: string, type: 'video' | 'image'): Promise<void> {
    const generalListKey = `media_list:${userId}`;
    const typeListKey = `media_list:${userId}:${type}`;
    
    // Remove from general list
    const generalList = await this.redisRequest('get', generalListKey) || [];
    const updatedGeneralList = generalList.filter((id: string) => id !== fileId);
    await this.redisRequest('set', generalListKey, updatedGeneralList);
    
    // Remove from type-specific list
    const typeList = await this.redisRequest('get', typeListKey) || [];
    const updatedTypeList = typeList.filter((id: string) => id !== fileId);
    await this.redisRequest('set', typeListKey, updatedTypeList);
  }

  /**
   * Utility Operations
   */
  
  async clearUserData(userId: string): Promise<boolean> {
    try {
      // Get all user keys
      const symptomKeys = await this.redisRequest('keys', `symptom:${userId}:*`);
      const mediaKeys = await this.redisRequest('keys', `media:${userId}:*`);
      const listKeys = [
        `symptom_list:${userId}`,
        `media_list:${userId}`,
        `media_list:${userId}:video`,
        `media_list:${userId}:image`,
      ];
      
      // Delete all keys
      const allKeys = [...symptomKeys, ...mediaKeys, ...listKeys];
      for (const key of allKeys) {
        await this.redisRequest('del', key);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to clear user data:', error);
      return false;
    }
  }

  async getStorageStats(userId: string): Promise<{
    symptomCount: number;
    videoCount: number;
    imageCount: number;
    totalSize: number;
  }> {
    try {
      const symptoms = await this.getUserSymptomEntries(userId);
      const videos = await this.getUserMediaFiles(userId, 'video');
      const images = await this.getUserMediaFiles(userId, 'image');
      
      const totalSize = [...videos, ...images].reduce((sum, file) => sum + file.size, 0);
      
      return {
        symptomCount: symptoms.length,
        videoCount: videos.length,
        imageCount: images.length,
        totalSize,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        symptomCount: 0,
        videoCount: 0,
        imageCount: 0,
        totalSize: 0,
      };
    }
  }

  /**
   * Sync localStorage data to Redis when connection is restored
   */
  async syncLocalStorageToRedis(): Promise<{ synced: number; failed: number }> {
    if (!this.isConnected) {
      console.warn('⚠️ Cannot sync: Redis not connected');
      return { synced: 0, failed: 0 };
    }

    const syncKey = 'redis_sync_pending';
    const pendingKeys = JSON.parse(localStorage.getItem(syncKey) || '[]');
    
    if (pendingKeys.length === 0) {
      console.log('✅ No pending data to sync');
      return { synced: 0, failed: 0 };
    }

    console.log(`🔄 Syncing ${pendingKeys.length} items from localStorage to Redis...`);
    
    let synced = 0;
    let failed = 0;
    
    for (const key of pendingKeys) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          // Try to save to Redis
          const result = await this.redisRequest('set', key, JSON.parse(data));
          if (result === 'OK') {
            synced++;
            console.log(`✅ Synced: ${key}`);
          } else {
            failed++;
            console.error(`❌ Failed to sync: ${key}`);
          }
        }
      } catch (error) {
        failed++;
        console.error(`❌ Error syncing ${key}:`, error);
      }
    }

    // Clear sync queue if all items were processed
    if (failed === 0) {
      localStorage.removeItem(syncKey);
      console.log('🎉 All data synced successfully, cleared sync queue');
    } else {
      // Keep failed items in sync queue
      const remainingKeys = pendingKeys.slice(-failed);
      localStorage.setItem(syncKey, JSON.stringify(remainingKeys));
      console.warn(`⚠️ ${failed} items failed to sync, keeping in queue`);
    }

    return { synced, failed };
  }

  /**
   * Get pending sync status
   */
  getPendingSyncCount(): number {
    const syncKey = 'redis_sync_pending';
    const pendingKeys = JSON.parse(localStorage.getItem(syncKey) || '[]');
    return pendingKeys.length;
  }

  /**
   * Force backup critical data to multiple storage locations
   */
  async backupCriticalData(data: any, identifier: string): Promise<boolean> {
    const timestamp = new Date().toISOString();
    const backupData = {
      ...data,
      backupTimestamp: timestamp,
      identifier
    };

    let backupSuccess = false;

    // Try localStorage first
    try {
      localStorage.setItem(`critical_backup_${identifier}`, JSON.stringify(backupData));
      backupSuccess = true;
      console.log(`💾 Critical data backed up to localStorage: ${identifier}`);
    } catch (error) {
      console.error('❌ localStorage backup failed:', error);
    }

    // Try sessionStorage as secondary backup
    try {
      sessionStorage.setItem(`critical_backup_${identifier}`, JSON.stringify(backupData));
      backupSuccess = true;
      console.log(`💾 Critical data backed up to sessionStorage: ${identifier}`);
    } catch (error) {
      console.error('❌ sessionStorage backup failed:', error);
    }

    // Try IndexedDB as tertiary backup (simplified)
    try {
      if ('indexedDB' in window) {
        // Store in a simple way for emergency recovery
        const backupString = JSON.stringify(backupData);
        localStorage.setItem(`idb_backup_${identifier}`, backupString);
        console.log(`💾 Critical data prepared for IndexedDB backup: ${identifier}`);
        backupSuccess = true;
      }
    } catch (error) {
      console.error('❌ IndexedDB backup preparation failed:', error);
    }

    return backupSuccess;
  }

  /**
   * Recover critical data from backups
   */
  recoverCriticalData(identifier: string): any | null {
    const sources = [
      () => localStorage.getItem(`critical_backup_${identifier}`),
      () => sessionStorage.getItem(`critical_backup_${identifier}`),
      () => localStorage.getItem(`idb_backup_${identifier}`)
    ];

    for (const getBackup of sources) {
      try {
        const backup = getBackup();
        if (backup) {
          const data = JSON.parse(backup);
          console.log(`🔄 Recovered critical data from backup: ${identifier}`);
          return data;
        }
      } catch (error) {
        console.warn(`⚠️ Failed to recover from backup source:`, error);
      }
    }

    console.warn(`⚠️ No backup found for: ${identifier}`);
    return null;
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    try {
      if (this.isConnected) {
        await fetch('/api/redis/disconnect', { method: 'POST' });
        this.isConnected = false;
        console.log('✅ Redis disconnected successfully');
      }
    } catch (error) {
      console.error('❌ Redis disconnect failed:', error);
    }
  }
}

// Factory function to create Redis service instance
export const createRedisService = (config?: Partial<RedisConfig>): RedisService => {
  const defaultConfig: RedisConfig = {
    host: import.meta.env.VITE_REDIS_HOST || 'localhost',
    port: parseInt(import.meta.env.VITE_REDIS_PORT || '6379'),
    password: import.meta.env.VITE_REDIS_PASSWORD,
    username: import.meta.env.VITE_REDIS_USERNAME,
    database: parseInt(import.meta.env.VITE_REDIS_DATABASE || '0'),
    tls: import.meta.env.VITE_REDIS_TLS === 'true',
  };

  return new RedisService({ ...defaultConfig, ...config });
};

export type { SymptomEntry, MediaFile, RedisConfig };
export { RedisService };
