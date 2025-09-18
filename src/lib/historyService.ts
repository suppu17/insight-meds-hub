// History service for managing medication search history using local storage

export interface HistoryEntry {
  id: string;
  medication: string;
  action: string;
  timestamp: number;
  data: {
    medication?: string;
    files?: File[];
    type?: 'upload' | 'manual' | 'document';
    videoDuration?: string;
    videoStrategy?: string;
    extractedInfo?: any;
  };
  results?: {
    overview?: any;
    analysis?: any;
    video?: {
      segments?: any[];
      finalVideo?: any;
      enhancedVideo?: any;
    };
    images?: any[];
    executiveSummary?: string;
  };
}

const HISTORY_KEY = 'insight_meds_history';
const MAX_HISTORY_ENTRIES = 4;

class HistoryService {
  private getHistory(): HistoryEntry[] {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading history from localStorage:', error);
      return [];
    }
  }

  private saveHistory(history: HistoryEntry[]): void {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving history to localStorage:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Add a new history entry or update existing one for the same medication
  addEntry(medication: string, action: string, data: HistoryEntry['data'], results?: HistoryEntry['results']): HistoryEntry {
    const history = this.getHistory();
    const normalizedMedication = medication.toLowerCase().trim();

    // Look for existing entry for this medication
    const existingEntryIndex = history.findIndex(entry =>
      entry.medication.toLowerCase().trim() === normalizedMedication
    );

    if (existingEntryIndex !== -1) {
      // Update existing entry
      const existingEntry = history[existingEntryIndex];

      // Update the entry with new action and results, keeping all previous data
      const updatedEntry: HistoryEntry = {
        ...existingEntry,
        action, // Update to latest action
        timestamp: Date.now(), // Update timestamp
        data: { ...existingEntry.data, ...data }, // Merge data
        results: {
          ...existingEntry.results,
          ...results,
          // Keep action-specific results
          ...(action === 'overview' && results?.overview ? { overview: results.overview } : {}),
          ...(action === 'picturize' && results?.images ? { images: results.images } : {}),
          ...(action === 'visualize' && results?.video ? { video: results.video } : {}),
        }
      };

      // Move to front and update
      history.splice(existingEntryIndex, 1);
      history.unshift(updatedEntry);

      this.saveHistory(history.slice(0, MAX_HISTORY_ENTRIES));
      return updatedEntry;
    } else {
      // Create new entry
      const newEntry: HistoryEntry = {
        id: this.generateId(),
        medication,
        action,
        timestamp: Date.now(),
        data,
        results
      };

      // Add to beginning of array
      history.unshift(newEntry);

      // Keep only the last 4 entries
      const trimmedHistory = history.slice(0, MAX_HISTORY_ENTRIES);

      this.saveHistory(trimmedHistory);
      return newEntry;
    }
  }

  // Update an existing entry with results
  updateEntry(id: string, results: HistoryEntry['results']): void {
    const history = this.getHistory();
    const entryIndex = history.findIndex(entry => entry.id === id);

    if (entryIndex !== -1) {
      history[entryIndex] = {
        ...history[entryIndex],
        results: {
          ...history[entryIndex].results,
          ...results
        }
      };
      this.saveHistory(history);
    }
  }

  // Get all history entries
  getAllEntries(): HistoryEntry[] {
    return this.getHistory();
  }

  // Get a specific entry by ID
  getEntry(id: string): HistoryEntry | undefined {
    const history = this.getHistory();
    return history.find(entry => entry.id === id);
  }

  // Delete a specific entry
  deleteEntry(id: string): void {
    const history = this.getHistory();
    const filteredHistory = history.filter(entry => entry.id !== id);
    this.saveHistory(filteredHistory);
  }

  // Clear all history
  clearHistory(): void {
    localStorage.removeItem(HISTORY_KEY);
  }

  // Get formatted date for display
  getFormattedDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  // Get action display name
  getActionDisplayName(action: string): string {
    const actionNames: Record<string, string> = {
      'overview': 'Overview',
      'visualize': 'Video Generation',
      'picturize': 'Image Generation',
      'research': 'Clinical Research',
      'deep_research': 'Deep Research',
      'competitive': 'Competitive Analysis',
      'market': 'Market Analysis',
      'pricing': 'Pricing Analysis',
      'safety': 'Safety Profile'
    };
    return actionNames[action] || action.charAt(0).toUpperCase() + action.slice(1);
  }
}

export const historyService = new HistoryService();