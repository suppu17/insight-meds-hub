// Gladia API service for audio transcription
// Documentation: https://docs.gladia.io/

interface GladiaTranscriptionResult {
  transcription: string;
  confidence?: number;
  language?: string;
  segments?: {
    start: number;
    end: number;
    text: string;
  }[];
}

interface GladiaConfig {
  apiKey: string;
  baseUrl?: string;
}

class GladiaService {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: GladiaConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.gladia.io/v2';
  }

  /**
   * Transcribe audio file using Gladia API
   */
  async transcribeAudio(audioBlob: Blob): Promise<GladiaTranscriptionResult> {
    try {
      // Convert blob to base64 for API upload
      const audioBuffer = await audioBlob.arrayBuffer();
      const audioBase64 = btoa(
        new Uint8Array(audioBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const response = await fetch(`${this.baseUrl}/transcription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: audioBase64,
          audio_format: 'wav',
          language: 'en', // Auto-detect or specify language
          enable_diarization: false, // Speaker separation not needed for symptoms
          transcription_hint: 'medical symptoms', // Help with medical terminology
        }),
      });

      if (!response.ok) {
        throw new Error(`Gladia API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      return {
        transcription: result.transcription || result.text || '',
        confidence: result.confidence,
        language: result.language,
        segments: result.segments,
      };

    } catch (error) {
      console.error('Gladia transcription failed:', error);
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stream real-time transcription (if supported by Gladia)
   */
  async startRealtimeTranscription(
    onTranscript: (text: string) => void,
    onError: (error: Error) => void
  ): Promise<() => void> {
    // Note: This would require WebSocket connection for real-time streaming
    // Implementation depends on Gladia's real-time API capabilities

    try {
      // For now, return a mock cleanup function
      // In a real implementation, you'd set up a WebSocket connection here
      console.log('Real-time transcription would start here');

      return () => {
        console.log('Real-time transcription cleanup');
      };
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Failed to start real-time transcription'));
      return () => {};
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Mock implementation for development/testing
class MockGladiaService implements Pick<GladiaService, 'transcribeAudio' | 'isConfigured'> {
  async transcribeAudio(audioBlob: Blob): Promise<GladiaTranscriptionResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock transcription results for testing
    const mockTranscriptions = [
      "I've been experiencing stomach pain and nausea after eating for the past few days.",
      "I have a persistent headache that gets worse in the afternoon and evening.",
      "I'm feeling feverish with body aches and I'm very tired.",
      "My throat is sore and I have difficulty swallowing, especially in the morning.",
      "I've been having chest tightness and shortness of breath during physical activity."
    ];

    const randomTranscription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];

    return {
      transcription: randomTranscription,
      confidence: 0.95,
      language: 'en',
      segments: [
        {
          start: 0,
          end: 3.5,
          text: randomTranscription
        }
      ]
    };
  }

  isConfigured(): boolean {
    return true; // Mock is always "configured"
  }
}

// Factory function to create appropriate service based on environment
export const createGladiaService = (apiKey?: string): GladiaService | MockGladiaService => {
  const gladiaApiKey = apiKey || import.meta.env.VITE_GLADIA_API_KEY;

  if (gladiaApiKey && process.env.NODE_ENV === 'production') {
    return new GladiaService({ apiKey: gladiaApiKey });
  } else {
    // Use mock service for development or when no API key is provided
    console.log('Using mock Gladia service for development/testing');
    return new MockGladiaService();
  }
};

export type { GladiaTranscriptionResult, GladiaConfig };
export { GladiaService, MockGladiaService };