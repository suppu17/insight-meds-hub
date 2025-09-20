/**
 * TigerData Integration Service
 * Provides comprehensive data collection and analysis with full logging and history storage
 */

export interface TigerDataConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  enableLogging: boolean;
  historyStorage: boolean;
}

export interface TigerDataRequest {
  id: string;
  timestamp: Date;
  endpoint: string;
  method: string;
  payload: any;
  userAgent?: string;
  sessionId?: string;
}

export interface TigerDataResponse {
  id: string;
  requestId: string;
  timestamp: Date;
  statusCode: number;
  data: any;
  headers: Record<string, string>;
  processingTime: number;
  success: boolean;
  error?: string;
}

export interface TigerDataLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata: any;
  requestId?: string;
  userId?: string;
}

export interface TigerDataHistory {
  id: string;
  timestamp: Date;
  type: 'request' | 'response' | 'file' | 'data' | 'log';
  content: any;
  tags: string[];
  userId?: string;
  sessionId?: string;
  size: number;
  checksum?: string;
}

class TigerDataService {
  private config: TigerDataConfig;
  private logs: TigerDataLog[] = [];
  private history: TigerDataHistory[] = [];
  private requestCounter = 0;

  constructor(config: TigerDataConfig) {
    this.config = config;
    this.log('info', 'TigerData service initialized', { config: { ...config, apiKey: '***' } });
  }

  /**
   * Make authenticated request to TigerData API
   */
  async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    payload?: any,
    options?: {
      userAgent?: string;
      sessionId?: string;
      tags?: string[];
    }
  ): Promise<TigerDataResponse> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    const request: TigerDataRequest = {
      id: requestId,
      timestamp: new Date(),
      endpoint,
      method,
      payload,
      userAgent: options?.userAgent,
      sessionId: options?.sessionId
    };

    this.log('info', `Starting TigerData request to ${endpoint}`, { requestId, method, endpoint });

    // Store request in history
    if (this.config.historyStorage) {
      await this.storeInHistory('request', request, options?.tags || ['api', 'request']);
    }

    try {
      const url = `${this.config.baseUrl}${endpoint}`;
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'User-Agent': options?.userAgent || 'MedInsight-Hub/1.0'
      };

      if (options?.sessionId) {
        headers['X-Session-ID'] = options.sessionId;
      }

      const fetchOptions: RequestInit = {
        method,
        headers,
        signal: AbortSignal.timeout(this.config.timeout)
      };

      if (payload && (method === 'POST' || method === 'PUT')) {
        fetchOptions.body = JSON.stringify(payload);
      }

      const response = await fetch(url, fetchOptions);
      const responseData = await response.json();
      const processingTime = Date.now() - startTime;

      const tigerResponse: TigerDataResponse = {
        id: this.generateResponseId(),
        requestId,
        timestamp: new Date(),
        statusCode: response.status,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
        processingTime,
        success: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };

      this.log('info', `TigerData request completed`, {
        requestId,
        statusCode: response.status,
        processingTime: `${processingTime}ms`,
        success: response.ok
      });

      // Store response in history
      if (this.config.historyStorage) {
        await this.storeInHistory('response', tigerResponse, [...(options?.tags || []), 'api', 'response']);
      }

      return tigerResponse;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      const tigerResponse: TigerDataResponse = {
        id: this.generateResponseId(),
        requestId,
        timestamp: new Date(),
        statusCode: 0,
        data: null,
        headers: {},
        processingTime,
        success: false,
        error: errorMessage
      };

      this.log('error', `TigerData request failed`, {
        requestId,
        error: errorMessage,
        processingTime: `${processingTime}ms`
      });

      // Store error response in history
      if (this.config.historyStorage) {
        await this.storeInHistory('response', tigerResponse, [...(options?.tags || []), 'api', 'response', 'error']);
      }

      return tigerResponse;
    }
  }

  /**
   * Get drug information using TigerData
   */
  async getDrugInformation(drugName: string, options?: {
    includeInteractions?: boolean;
    includeSideEffects?: boolean;
    includeResearch?: boolean;
    sessionId?: string;
  }): Promise<TigerDataResponse> {
    const payload = {
      drug_name: drugName,
      include_interactions: options?.includeInteractions ?? true,
      include_side_effects: options?.includeSideEffects ?? true,
      include_research: options?.includeResearch ?? true,
      timestamp: new Date().toISOString()
    };

    return await this.makeRequest('/api/v1/drugs/comprehensive', 'POST', payload, {
      sessionId: options?.sessionId,
      tags: ['drug-info', 'medical', drugName.toLowerCase()]
    });
  }

  /**
   * Analyze symptoms using TigerData
   */
  async analyzeSymptoms(symptoms: string[], patientInfo?: {
    age?: number;
    gender?: string;
    medicalHistory?: string[];
  }, sessionId?: string): Promise<TigerDataResponse> {
    const payload = {
      symptoms,
      patient_info: patientInfo,
      analysis_type: 'comprehensive',
      timestamp: new Date().toISOString()
    };

    return await this.makeRequest('/api/v1/symptoms/analyze', 'POST', payload, {
      sessionId,
      tags: ['symptom-analysis', 'medical', 'ai-analysis']
    });
  }

  /**
   * Get market research data using TigerData
   */
  async getMarketResearch(query: string, options?: {
    industry?: string;
    region?: string;
    timeframe?: string;
    sessionId?: string;
  }): Promise<TigerDataResponse> {
    const payload = {
      query,
      industry: options?.industry || 'healthcare',
      region: options?.region || 'global',
      timeframe: options?.timeframe || '1year',
      timestamp: new Date().toISOString()
    };

    return await this.makeRequest('/api/v1/market/research', 'POST', payload, {
      sessionId: options?.sessionId,
      tags: ['market-research', 'business-intelligence', query.toLowerCase()]
    });
  }

  /**
   * Store file data with TigerData
   */
  async storeFile(fileData: Blob | ArrayBuffer, metadata: {
    filename: string;
    contentType: string;
    tags?: string[];
    description?: string;
    sessionId?: string;
  }): Promise<TigerDataResponse> {
    const fileId = this.generateFileId();
    const fileSize = fileData instanceof Blob ? fileData.size : fileData.byteLength;

    // Convert to base64 for API transmission
    const base64Data = await this.convertToBase64(fileData);

    const payload = {
      file_id: fileId,
      filename: metadata.filename,
      content_type: metadata.contentType,
      size: fileSize,
      data: base64Data,
      description: metadata.description,
      tags: metadata.tags || [],
      timestamp: new Date().toISOString()
    };

    const response = await this.makeRequest('/api/v1/files/store', 'POST', payload, {
      sessionId: metadata.sessionId,
      tags: ['file-storage', 'upload', ...(metadata.tags || [])]
    });

    // Store file metadata in history
    if (this.config.historyStorage) {
      await this.storeInHistory('file', {
        fileId,
        filename: metadata.filename,
        contentType: metadata.contentType,
        size: fileSize,
        description: metadata.description,
        tags: metadata.tags,
        uploadTimestamp: new Date()
      }, ['file', 'upload', ...(metadata.tags || [])]);
    }

    return response;
  }

  /**
   * Log message with metadata
   */
  private log(level: TigerDataLog['level'], message: string, metadata: any = {}, requestId?: string, userId?: string): void {
    if (!this.config.enableLogging) return;

    const logEntry: TigerDataLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      message,
      metadata,
      requestId,
      userId
    };

    this.logs.push(logEntry);

    // Console logging for development
    const logMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    logMethod(`[TigerData:${level.toUpperCase()}] ${message}`, metadata);

    // Store log in history
    if (this.config.historyStorage) {
      this.storeInHistory('log', logEntry, ['log', level]);
    }

    // Keep only last 1000 logs in memory
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  /**
   * Store data in history
   */
  private async storeInHistory(
    type: TigerDataHistory['type'],
    content: any,
    tags: string[] = [],
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    const historyEntry: TigerDataHistory = {
      id: this.generateHistoryId(),
      timestamp: new Date(),
      type,
      content,
      tags,
      userId,
      sessionId,
      size: JSON.stringify(content).length,
      checksum: await this.generateChecksum(content)
    };

    this.history.push(historyEntry);

    // Keep only last 10000 entries in memory
    if (this.history.length > 10000) {
      this.history = this.history.slice(-10000);
    }

    // In a production environment, you would persist this to a database
    this.log('debug', `Stored ${type} in history`, {
      historyId: historyEntry.id,
      size: historyEntry.size,
      tags: historyEntry.tags
    });
  }

  /**
   * Get logs with filtering
   */
  getLogs(filter?: {
    level?: TigerDataLog['level'];
    requestId?: string;
    userId?: string;
    since?: Date;
    limit?: number;
  }): TigerDataLog[] {
    let filteredLogs = [...this.logs];

    if (filter?.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filter.level);
    }

    if (filter?.requestId) {
      filteredLogs = filteredLogs.filter(log => log.requestId === filter.requestId);
    }

    if (filter?.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filter.userId);
    }

    if (filter?.since) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.since!);
    }

    if (filter?.limit) {
      filteredLogs = filteredLogs.slice(-filter.limit);
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get history with filtering
   */
  getHistory(filter?: {
    type?: TigerDataHistory['type'];
    tags?: string[];
    userId?: string;
    sessionId?: string;
    since?: Date;
    limit?: number;
  }): TigerDataHistory[] {
    let filteredHistory = [...this.history];

    if (filter?.type) {
      filteredHistory = filteredHistory.filter(entry => entry.type === filter.type);
    }

    if (filter?.tags && filter.tags.length > 0) {
      filteredHistory = filteredHistory.filter(entry =>
        filter.tags!.some(tag => entry.tags.includes(tag))
      );
    }

    if (filter?.userId) {
      filteredHistory = filteredHistory.filter(entry => entry.userId === filter.userId);
    }

    if (filter?.sessionId) {
      filteredHistory = filteredHistory.filter(entry => entry.sessionId === filter.sessionId);
    }

    if (filter?.since) {
      filteredHistory = filteredHistory.filter(entry => entry.timestamp >= filter.since!);
    }

    if (filter?.limit) {
      filteredHistory = filteredHistory.slice(-filter.limit);
    }

    return filteredHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Export history and logs for backup
   */
  exportData(): {
    logs: TigerDataLog[];
    history: TigerDataHistory[];
    exportTimestamp: Date;
    totalSize: number;
  } {
    const exportData = {
      logs: this.logs,
      history: this.history,
      exportTimestamp: new Date(),
      totalSize: JSON.stringify({ logs: this.logs, history: this.history }).length
    };

    this.log('info', 'Data exported', {
      logsCount: this.logs.length,
      historyCount: this.history.length,
      totalSize: exportData.totalSize
    });

    return exportData;
  }

  /**
   * Clear all logs and history
   */
  clearData(): void {
    const logsCount = this.logs.length;
    const historyCount = this.history.length;

    this.logs = [];
    this.history = [];

    this.log('info', 'All data cleared', { logsCount, historyCount });
  }

  /**
   * Get service statistics
   */
  getStats(): {
    totalRequests: number;
    totalLogs: number;
    totalHistoryEntries: number;
    memoryUsage: number;
    uptime: number;
  } {
    return {
      totalRequests: this.requestCounter,
      totalLogs: this.logs.length,
      totalHistoryEntries: this.history.length,
      memoryUsage: JSON.stringify({ logs: this.logs, history: this.history }).length,
      uptime: Date.now() - (this.logs[0]?.timestamp.getTime() || Date.now())
    };
  }

  // Helper methods
  private generateRequestId(): string {
    this.requestCounter++;
    return `req_${Date.now()}_${this.requestCounter}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateResponseId(): string {
    return `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateHistoryId(): string {
    return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async convertToBase64(data: Blob | ArrayBuffer): Promise<string> {
    if (data instanceof Blob) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:mime;base64, prefix
        };
        reader.readAsDataURL(data);
      });
    } else {
      // ArrayBuffer to base64
      const bytes = new Uint8Array(data);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
  }

  private async generateChecksum(data: any): Promise<string> {
    const jsonString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    
    if (crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback for environments without crypto.subtle
      return `checksum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }
}

// Singleton instance
let tigerDataService: TigerDataService | null = null;

/**
 * Get or create TigerData service instance
 */
export function getTigerDataService(): TigerDataService {
  if (!tigerDataService) {
    const config: TigerDataConfig = {
      apiKey: '01K5FVEAW4KJ0YEDFKFY7Y7E47', // TigerData API Key
      baseUrl: import.meta.env.VITE_TIGER_DATA_BASE_URL || 'https://api.tigerdata.com',
      timeout: 30000,
      enableLogging: true,
      historyStorage: true
    };

    tigerDataService = new TigerDataService(config);
  }

  return tigerDataService;
}

/**
 * Quick function to get drug information via TigerData
 */
export async function getTigerDataDrugInfo(drugName: string, sessionId?: string): Promise<TigerDataResponse> {
  const service = getTigerDataService();
  return await service.getDrugInformation(drugName, { sessionId });
}

/**
 * Quick function to analyze symptoms via TigerData
 */
export async function analyzeSymptomsWithTigerData(
  symptoms: string[],
  patientInfo?: { age?: number; gender?: string; medicalHistory?: string[] },
  sessionId?: string
): Promise<TigerDataResponse> {
  const service = getTigerDataService();
  return await service.analyzeSymptoms(symptoms, patientInfo, sessionId);
}

/**
 * Quick function to get market research via TigerData
 */
export async function getTigerDataMarketResearch(
  query: string,
  options?: { industry?: string; region?: string; timeframe?: string },
  sessionId?: string
): Promise<TigerDataResponse> {
  const service = getTigerDataService();
  return await service.getMarketResearch(query, { ...options, sessionId });
}

export default TigerDataService;
