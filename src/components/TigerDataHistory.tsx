import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getTigerDataService, TigerDataLog, TigerDataHistory } from '@/lib/services/tigerDataService';
import { Download, Search, Filter, Eye, Trash2, Database, FileText, Activity, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const TigerDataHistoryComponent: React.FC = () => {
  const [logs, setLogs] = useState<TigerDataLog[]>([]);
  const [history, setHistory] = useState<TigerDataHistory[]>([]);
  const [stats, setStats] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [logLevelFilter, setLogLevelFilter] = useState<string>('all');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const tigerDataService = getTigerDataService();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    try {
      const allLogs = tigerDataService.getLogs({ limit: 1000 });
      const allHistory = tigerDataService.getHistory({ limit: 1000 });
      const serviceStats = tigerDataService.getStats();

      setLogs(allLogs);
      setHistory(allHistory);
      setStats(serviceStats);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load TigerData history:', error);
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         JSON.stringify(log.metadata).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = logLevelFilter === 'all' || log.level === logLevelFilter;
    return matchesSearch && matchesLevel;
  });

  const filteredHistory = history.filter(entry => {
    const matchesSearch = JSON.stringify(entry.content).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = historyTypeFilter === 'all' || entry.type === historyTypeFilter;
    return matchesSearch && matchesType;
  });

  const handleExportData = () => {
    const exportData = tigerDataService.exportData();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tigerdata-export-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all logs and history? This action cannot be undone.')) {
      tigerDataService.clearData();
      loadData();
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      case 'info': return 'default';
      case 'debug': return 'outline';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'request': return <Activity className="w-4 h-4" />;
      case 'response': return <Database className="w-4 h-4" />;
      case 'file': return <FileText className="w-4 h-4" />;
      case 'data': return <Database className="w-4 h-4" />;
      case 'log': return <AlertCircle className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p>Loading TigerData history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.totalRequests || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Log Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalLogs || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">History Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalHistoryEntries || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatBytes(stats.memoryUsage || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>TigerData History & Logs</CardTitle>
              <CardDescription>
                Comprehensive logging and data history for all TigerData operations
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportData} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={handleClearData} variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search logs and history..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={logLevelFilter} onValueChange={setLogLevelFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Log Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
            <Select value={historyTypeFilter} onValueChange={setHistoryTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="History Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="request">Requests</SelectItem>
                <SelectItem value="response">Responses</SelectItem>
                <SelectItem value="file">Files</SelectItem>
                <SelectItem value="data">Data</SelectItem>
                <SelectItem value="log">Logs</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="logs" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="logs">Logs ({filteredLogs.length})</TabsTrigger>
              <TabsTrigger value="history">History ({filteredHistory.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="logs" className="mt-6">
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {filteredLogs.map((log) => (
                    <Card key={log.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={getLevelColor(log.level)}>
                              {log.level.toUpperCase()}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {format(log.timestamp, 'yyyy-MM-dd HH:mm:ss')}
                            </span>
                            {log.requestId && (
                              <Badge variant="outline" className="text-xs">
                                {log.requestId}
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium mb-1">{log.message}</p>
                          {Object.keys(log.metadata).length > 0 && (
                            <div className="text-sm text-gray-600">
                              <strong>Metadata:</strong> {JSON.stringify(log.metadata, null, 2).substring(0, 100)}...
                            </div>
                          )}
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedItem(log)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Log Details</DialogTitle>
                              <DialogDescription>
                                Full log entry details and metadata
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <strong>ID:</strong> {log.id}
                              </div>
                              <div>
                                <strong>Timestamp:</strong> {format(log.timestamp, 'yyyy-MM-dd HH:mm:ss.SSS')}
                              </div>
                              <div>
                                <strong>Level:</strong> <Badge variant={getLevelColor(log.level)}>{log.level}</Badge>
                              </div>
                              <div>
                                <strong>Message:</strong> {log.message}
                              </div>
                              {log.requestId && (
                                <div>
                                  <strong>Request ID:</strong> {log.requestId}
                                </div>
                              )}
                              {log.userId && (
                                <div>
                                  <strong>User ID:</strong> {log.userId}
                                </div>
                              )}
                              <div>
                                <strong>Metadata:</strong>
                                <pre className="bg-gray-100 p-4 rounded-lg mt-2 text-sm overflow-x-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </Card>
                  ))}
                  {filteredLogs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No logs found matching your criteria
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <ScrollArea className="h-[600px]">
                <div className="space-y-2">
                  {filteredHistory.map((entry) => (
                    <Card key={entry.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              {getTypeIcon(entry.type)}
                              <Badge variant="secondary">{entry.type}</Badge>
                            </div>
                            <span className="text-sm text-gray-500">
                              {format(entry.timestamp, 'yyyy-MM-dd HH:mm:ss')}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {formatBytes(entry.size)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {entry.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-gray-600">
                            <strong>Content Preview:</strong> {JSON.stringify(entry.content).substring(0, 150)}...
                          </p>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedItem(entry)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>History Entry Details</DialogTitle>
                              <DialogDescription>
                                Full history entry content and metadata
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <strong>ID:</strong> {entry.id}
                              </div>
                              <div>
                                <strong>Timestamp:</strong> {format(entry.timestamp, 'yyyy-MM-dd HH:mm:ss.SSS')}
                              </div>
                              <div>
                                <strong>Type:</strong> <Badge variant="secondary">{entry.type}</Badge>
                              </div>
                              <div>
                                <strong>Size:</strong> {formatBytes(entry.size)}
                              </div>
                              {entry.checksum && (
                                <div>
                                  <strong>Checksum:</strong> <code className="text-xs">{entry.checksum}</code>
                                </div>
                              )}
                              <div>
                                <strong>Tags:</strong>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {entry.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              {entry.sessionId && (
                                <div>
                                  <strong>Session ID:</strong> {entry.sessionId}
                                </div>
                              )}
                              {entry.userId && (
                                <div>
                                  <strong>User ID:</strong> {entry.userId}
                                </div>
                              )}
                              <div>
                                <strong>Content:</strong>
                                <pre className="bg-gray-100 p-4 rounded-lg mt-2 text-sm overflow-x-auto max-h-96">
                                  {JSON.stringify(entry.content, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </Card>
                  ))}
                  {filteredHistory.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No history entries found matching your criteria
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TigerDataHistoryComponent;
