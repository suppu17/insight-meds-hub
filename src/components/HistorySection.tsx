import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  History,
  Clock,
  Pill,
  Video,
  Image,
  BarChart3,
  Brain,
  Trash2,
  Play,
  Eye,
  ArrowRight,
  Users,
  TrendingUp,
  Microscope
} from "lucide-react";
import { historyService, type HistoryEntry } from "@/lib/historyService";

interface HistorySectionProps {
  onSelectEntry: (entry: HistoryEntry) => void;
  onBack: () => void;
}

const HistorySection = ({ onSelectEntry, onBack }: HistorySectionProps) => {
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const entries = historyService.getAllEntries();
    setHistoryEntries(entries);
  };

  const handleDeleteEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the entry selection
    historyService.deleteEntry(id);
    loadHistory();
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      historyService.clearHistory();
      loadHistory();
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'overview':
        return Eye;
      case 'visualize':
        return Video;
      case 'picturize':
        return Image;
      case 'research':
        return Brain;
      case 'deep_research':
        return Microscope;
      case 'competitive':
        return Users;
      case 'market':
      case 'pricing':
        return TrendingUp;
      default:
        return BarChart3;
    }
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'overview':
        return 'text-blue-600 bg-blue/10 border-blue/20';
      case 'visualize':
        return 'text-purple-600 bg-purple/10 border-purple/20';
      case 'picturize':
        return 'text-green-600 bg-green/10 border-green/20';
      case 'research':
        return 'text-primary bg-primary/10 border-primary/20';
      case 'deep_research':
        return 'text-accent bg-accent/10 border-accent/20';
      case 'competitive':
        return 'text-orange-600 bg-orange/10 border-orange/20';
      case 'market':
      case 'pricing':
        return 'text-success bg-success/10 border-success/20';
      default:
        return 'text-muted-foreground bg-muted/10 border-muted/20';
    }
  };

  const hasResults = (entry: HistoryEntry): boolean => {
    return !!(entry.results?.overview ||
              entry.results?.analysis ||
              entry.results?.video?.segments?.length ||
              entry.results?.images?.length ||
              entry.results?.executiveSummary);
  };

  const getResultsPreview = (entry: HistoryEntry): string => {
    const results = entry.results;
    if (!results) return 'No results available';

    const parts = [];
    if (results.overview) parts.push('overview');
    if (results.analysis) parts.push('analysis');
    if (results.video?.segments?.length) parts.push(`${results.video.segments.length} video segments`);
    if (results.images?.length) parts.push(`${results.images.length} images`);
    if (results.executiveSummary) parts.push('AI summary');

    return parts.length > 0 ? parts.join(', ') : 'Processing...';
  };

  if (historyEntries.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="glass" size="sm">
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Search History</h2>
            <p className="text-sm text-muted-foreground">
              Your recent medication searches and analyses
            </p>
          </div>
        </div>

        <Card className="glass-card p-12">
          <div className="text-center space-y-4">
            <div className="glass-panel rounded-full p-6 w-fit mx-auto">
              <History className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">No Search History</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your recent medication searches will appear here. Start by searching for a medication or uploading a prescription.
            </p>
            <Button onClick={onBack} variant="outline" className="mt-4 rounded-xl shadow-lg">
              Start New Search
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="glass" size="sm">
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <History className="w-6 h-6 text-primary" />
              Search History
            </h2>
            <p className="text-sm text-muted-foreground">
              {historyEntries.length} recent searches (last 4 saved)
            </p>
          </div>
        </div>

        {historyEntries.length > 0 && (
          <Button onClick={handleClearAllHistory} variant="outline" size="sm" className="rounded-xl shadow-lg">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* History Entries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {historyEntries.map((entry) => {
          const ActionIcon = getActionIcon(entry.action);
          const actionColor = getActionColor(entry.action);

          return (
            <Card
              key={entry.id}
              className="glass-card p-6 cursor-pointer hover:bg-accent/5 transition-all duration-200 hover:border-primary/30"
              onClick={() => onSelectEntry(entry)}
            >
              {/* Entry Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${actionColor}`}>
                    <ActionIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Pill className="w-4 h-4" />
                      {entry.medication}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {historyService.getActionDisplayName(entry.action)}
                    </Badge>
                  </div>
                </div>

                <Button
                  onClick={(e) => handleDeleteEntry(entry.id, e)}
                  variant="ghost"
                  size="sm"
                  className="opacity-70 hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Entry Details */}
              <div className="space-y-3">
                {/* Timestamp */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {historyService.getFormattedDate(entry.timestamp)}
                </div>

                {/* Results Preview */}
                {hasResults(entry) ? (
                  <div className="glass-panel p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span className="text-sm font-medium text-success">Results Available</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getResultsPreview(entry)}
                    </p>
                  </div>
                ) : (
                  <div className="glass-panel p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-warning">Processing...</span>
                    </div>
                  </div>
                )}

                {/* Data Type */}
                {entry.data.type && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Input:</span>
                    <Badge variant="outline" className="text-xs">
                      {entry.data.type === 'manual' ? 'Manual Entry' :
                       entry.data.type === 'upload' ? 'File Upload' :
                       'Document Analysis'}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-4 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-primary hover:bg-primary/10"
                >
                  <span className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    {hasResults(entry) ? 'View Results' : 'Continue Analysis'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Info Card */}
      <Card className="glass-card p-6 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <History className="w-5 h-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-primary mb-1">About Search History</p>
            <p className="text-muted-foreground">
              Your last 4 medication searches are automatically saved locally on your device.
              This includes all analyses, generated videos, images, and reports.
              Click on any entry to revisit the results or continue where you left off.
            </p>
            <div className="flex gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">Local Storage</Badge>
              <Badge variant="secondary" className="text-xs">4 Entries Max</Badge>
              <Badge variant="secondary" className="text-xs">Auto-Save</Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HistorySection;