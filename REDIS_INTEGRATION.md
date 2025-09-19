# Redis Integration for MedInsight Hub

## Overview

MedInsight Hub now includes a comprehensive Redis integration for storing symptom logs, videos, and generated images. The system includes a robust **localStorage fallback mechanism** to ensure **no patient data is ever lost**, even if Redis is unavailable.

## 🔄 **Automatic Fallback System**

### **Primary Storage: Redis**
- High-performance, scalable data storage
- Real-time data synchronization
- Advanced caching capabilities
- Multi-user support

### **Fallback Storage: localStorage**
- **Automatic fallback** when Redis is unavailable
- **Zero data loss** - all operations continue seamlessly
- **Automatic sync** when Redis connection is restored
- **Multiple backup layers** for critical data

## 🛡️ **Data Safety Features**

### **1. Triple Backup System**
```typescript
// Primary: Redis (when available)
await saveSymptom(symptomData);

// Fallback 1: localStorage (automatic)
localStorage.setItem(key, JSON.stringify(data));

// Fallback 2: sessionStorage (critical data)
sessionStorage.setItem(`backup_${key}`, JSON.stringify(data));

// Fallback 3: IndexedDB preparation (emergency)
localStorage.setItem(`idb_backup_${key}`, JSON.stringify(data));
```

### **2. Automatic Data Synchronization**
- **Pending sync queue**: Tracks all localStorage data waiting for Redis
- **Auto-sync on reconnect**: Automatically syncs when Redis comes back online
- **Conflict resolution**: Handles data conflicts intelligently
- **Retry mechanism**: Failed syncs are retried automatically

### **3. Data Integrity Checks**
- **Timestamps**: All data includes creation/modification timestamps
- **Age warnings**: Alerts for old data (>7 days)
- **Checksum validation**: Ensures data integrity during sync
- **Recovery mechanisms**: Multiple recovery options for corrupted data

## 📊 **Storage Architecture**

### **Symptom Logs**
```
Redis Keys:
- symptom:{userId}:{entryId} → Symptom entry data
- symptom_list:{userId} → List of entry IDs (sorted by date)

localStorage Keys (Fallback):
- symptom:{userId}:{entryId} → Same structure as Redis
- symptom:{userId}:{entryId}_timestamp → Data creation time
- redis_sync_pending → Array of keys waiting for sync
```

### **Media Files (Videos & Images)**
```
Redis Keys:
- media:{userId}:{fileId} → Media file metadata
- media_list:{userId} → All media files
- media_list:{userId}:video → Video files only
- media_list:{userId}:image → Image files only

localStorage Keys (Fallback):
- Same structure with automatic fallback
- Additional backup mechanisms for large files
```

## 🚀 **Usage Examples**

### **Basic Usage with Automatic Fallback**
```typescript
import { useRedis } from '@/hooks/useRedis';

const MyComponent = () => {
  const {
    isConnected,        // Redis connection status
    saveSymptom,        // Saves to Redis or localStorage
    getSymptoms,        // Gets from Redis or localStorage
    syncToRedis,        // Manual sync trigger
    getPendingSyncCount // Check pending items
  } = useRedis({ userId: 'patient_123' });

  // Save symptom (works with or without Redis)
  const handleSave = async () => {
    const success = await saveSymptom({
      concern: 'Headache',
      symptoms: 'Mild headache with light sensitivity',
      severity: 'mild',
      timestamp: new Date(),
      autoSaved: false
    });
    
    if (success) {
      console.log('✅ Symptom saved successfully');
      // Data is automatically backed up if Redis fails
    }
  };

  return (
    <div>
      <div>Status: {isConnected ? 'Redis' : 'Local Storage'}</div>
      <button onClick={handleSave}>Save Symptom</button>
    </div>
  );
};
```

### **Manual Sync and Recovery**
```typescript
// Check for pending sync items
const pendingCount = getPendingSyncCount();
if (pendingCount > 0) {
  console.log(`${pendingCount} items waiting to sync to Redis`);
}

// Manual sync trigger
const syncResult = await syncToRedis();
console.log(`Synced: ${syncResult.synced}, Failed: ${syncResult.failed}`);

// Backup critical data
await backupCriticalData(importantData, 'critical_symptom_123');

// Recover from backup
const recovered = recoverCriticalData('critical_symptom_123');
```

## ⚙️ **Configuration**

### **Environment Variables**
```bash
# Redis Configuration
VITE_REDIS_HOST=localhost
VITE_REDIS_PORT=6379
VITE_REDIS_PASSWORD=your_password
VITE_REDIS_USERNAME=default
VITE_REDIS_DATABASE=0
VITE_REDIS_TLS=false

# Redis Cloud Example
VITE_REDIS_HOST=redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com
VITE_REDIS_PORT=12345
VITE_REDIS_PASSWORD=your_redis_cloud_password
VITE_REDIS_TLS=true
```

### **Redis Service Configuration**
```typescript
const redisService = createRedisService({
  host: 'your-redis-host.com',
  port: 6379,
  password: 'your-password',
  tls: true
});
```

## 🔧 **Connection Status Monitoring**

The UI includes real-time connection status indicators:

### **Header Status Badge**
- 🟢 **"Redis"** - Connected to Redis
- 🟠 **"Local"** - Using localStorage fallback
- 🔄 **Loading** - Connecting/syncing
- ❌ **Error** - Connection issues (with fallback active)

### **Detailed Monitoring**
```typescript
// Connection status
const { isConnected, isLoading, error } = useRedis();

// Storage statistics
const stats = await getStorageStats();
console.log(`Symptoms: ${stats.symptomCount}`);
console.log(`Videos: ${stats.videoCount}`);
console.log(`Images: ${stats.imageCount}`);
console.log(`Total Size: ${stats.totalSize} bytes`);
```

## 🔄 **Sync Behavior**

### **Automatic Sync Triggers**
1. **On Redis reconnection** (2-second delay for stability)
2. **On app startup** (if Redis is available)
3. **On manual trigger** (via syncToRedis())
4. **Periodic sync** (every 5 minutes if pending items exist)

### **Sync Process**
1. **Check connection**: Verify Redis is available
2. **Get pending items**: Retrieve localStorage items marked for sync
3. **Batch sync**: Process items in batches to avoid overwhelming Redis
4. **Conflict resolution**: Handle any data conflicts intelligently
5. **Cleanup**: Remove successfully synced items from localStorage
6. **Retry queue**: Keep failed items for next sync attempt

## 🚨 **Error Handling**

### **Connection Failures**
- **Graceful degradation**: Seamlessly switch to localStorage
- **User notification**: Clear status indicators
- **Retry logic**: Automatic reconnection attempts
- **No data loss**: All operations continue normally

### **Storage Failures**
- **Multiple fallbacks**: localStorage → sessionStorage → IndexedDB prep
- **Error logging**: Comprehensive error tracking
- **Recovery options**: Multiple data recovery mechanisms
- **User alerts**: Clear error messages with recovery instructions

## 📈 **Performance Optimizations**

### **Caching Strategy**
- **In-memory cache**: Frequently accessed data
- **Cache invalidation**: Smart cache updates
- **Batch operations**: Reduce Redis calls
- **Lazy loading**: Load data on demand

### **Data Compression**
- **JSON optimization**: Efficient data serialization
- **Timestamp compression**: Optimized date storage
- **Batch transfers**: Reduce network overhead

## 🔐 **Security Considerations**

### **Data Encryption**
- **TLS connections**: Encrypted Redis connections
- **Local encryption**: Sensitive data encryption in localStorage
- **Key management**: Secure Redis authentication

### **Access Control**
- **User isolation**: Data segregated by user ID
- **Permission checks**: Validate user access
- **Audit logging**: Track data access and modifications

## 🧪 **Testing**

### **Fallback Testing**
```bash
# Test Redis connection failure
# Disconnect from Redis and verify localStorage fallback

# Test data sync
# Reconnect to Redis and verify automatic sync

# Test data recovery
# Clear localStorage and verify backup recovery
```

### **Load Testing**
- **Large datasets**: Test with thousands of symptom entries
- **Concurrent users**: Multi-user access patterns
- **Network failures**: Simulate connection issues
- **Storage limits**: Test localStorage capacity limits

## 📋 **Monitoring & Maintenance**

### **Health Checks**
- **Connection monitoring**: Real-time Redis status
- **Sync queue monitoring**: Track pending items
- **Storage usage**: Monitor localStorage usage
- **Error rate tracking**: Track failure rates

### **Maintenance Tasks**
- **Data cleanup**: Remove old backup data
- **Sync queue management**: Clear stale sync items
- **Performance monitoring**: Track operation times
- **Capacity planning**: Monitor storage growth

## 🎯 **Best Practices**

### **For Developers**
1. **Always use the useRedis hook** - Don't access Redis directly
2. **Handle async operations** - All storage operations are async
3. **Check connection status** - Use isConnected for UI decisions
4. **Implement error handling** - Always handle storage failures gracefully
5. **Test fallback scenarios** - Regularly test without Redis

### **For Deployment**
1. **Configure Redis properly** - Use environment variables
2. **Monitor connection health** - Set up Redis monitoring
3. **Plan for failures** - Ensure localStorage limits are adequate
4. **Backup strategy** - Regular Redis backups
5. **Performance tuning** - Optimize Redis configuration

## 🔗 **Related Documentation**

- [Redis Cloud Setup Guide](./REDIS_CLOUD_SETUP.md)
- [Data Migration Guide](./DATA_MIGRATION.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Performance Tuning](./PERFORMANCE_TUNING.md)

---

## 🎉 **Summary**

The Redis integration provides:

✅ **Zero Data Loss** - Automatic localStorage fallback  
✅ **Seamless Experience** - Users never notice Redis failures  
✅ **Automatic Sync** - Data syncs when Redis reconnects  
✅ **Multiple Backups** - Triple-redundant data protection  
✅ **Real-time Status** - Clear connection indicators  
✅ **Performance** - Optimized for speed and reliability  
✅ **Scalability** - Ready for multi-user deployment  

**Patient data is always safe, regardless of Redis availability!** 🏥💾
