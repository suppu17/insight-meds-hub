export class VideoGenerationError extends Error {
  constructor(
    message: string,
    public stage: string,
    public retryable: boolean = true,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'VideoGenerationError';
  }
}

export class APIConfigurationError extends Error {
  constructor(message: string, public service: string) {
    super(message);
    this.name = 'APIConfigurationError';
  }
}

export interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry on the last attempt or non-retryable errors
      if (attempt === maxRetries || (error instanceof VideoGenerationError && !error.retryable)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);

      console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`, error);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export function validateEnvironmentConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check fal.ai configuration
  const falKey = import.meta.env.VITE_FAL_API_KEY;
  if (!falKey) {
    errors.push('VITE_FAL_API_KEY is not configured. Video generation will not work.');
  } else if (falKey === 'your_fal_api_key_here') {
    errors.push('VITE_FAL_API_KEY is using the example value. Please set your actual API key.');
  }

  // Check AWS configuration
  const awsAccessKey = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
  const awsSecretKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
  const awsRegion = import.meta.env.VITE_AWS_REGION;

  if (!awsAccessKey || !awsSecretKey || !awsRegion) {
    warnings.push('AWS Bedrock credentials not fully configured. Falling back to sample drug analysis.');
  } else if (
    awsAccessKey === 'your_aws_access_key_here' ||
    awsSecretKey === 'your_aws_secret_key_here'
  ) {
    warnings.push('AWS credentials are using example values. Please set your actual credentials.');
  }

  // Security warning for production
  if (import.meta.env.PROD && (falKey || awsAccessKey)) {
    warnings.push(
      'API keys are exposed in the frontend build. In production, use a backend proxy for security.'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function handleVideoGenerationError(
  error: unknown,
  stage: string,
  context?: Record<string, unknown>
): VideoGenerationError {
  console.error(`Video generation error in stage "${stage}":`, error, context);

  if (error instanceof VideoGenerationError) {
    return error;
  }

  // Handle specific error types
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return new VideoGenerationError(
        'Network connection error. Please check your internet connection.',
        stage,
        true,
        error
      );
    }

    // API quota/rate limit errors
    if (error.message.includes('quota') || error.message.includes('rate limit')) {
      return new VideoGenerationError(
        'API rate limit reached. Please wait a moment and try again.',
        stage,
        true,
        error
      );
    }

    // Authentication errors
    if (error.message.includes('auth') || error.message.includes('credential')) {
      return new VideoGenerationError(
        'API authentication failed. Please check your API keys.',
        stage,
        false,
        error
      );
    }

    // Content policy errors
    if (error.message.includes('content policy') || error.message.includes('safety')) {
      return new VideoGenerationError(
        'Content was rejected by safety filters. Please try with different medication.',
        stage,
        false,
        error
      );
    }

    return new VideoGenerationError(
      `${stage} failed: ${error.message}`,
      stage,
      true,
      error
    );
  }

  return new VideoGenerationError(
    `Unknown error in ${stage}. Please try again.`,
    stage,
    true,
    error
  );
}

export function getErrorRecoveryAdvice(error: VideoGenerationError): string[] {
  const advice: string[] = [];

  switch (error.stage) {
    case 'analysis':
      advice.push('Try using a more common medication name');
      advice.push('Check if AWS Bedrock credentials are properly configured');
      break;

    case 'video-segments':
      advice.push('Ensure fal.ai API key is valid and has sufficient credits');
      advice.push('Try again in a few minutes if rate limited');
      advice.push('Some medications may have content restrictions');
      break;

    case 'concatenation':
      advice.push('This is usually a temporary issue, try again');
      advice.push('Ensure your browser supports video processing features');
      break;

    case 'images':
      advice.push('Image generation is optional and won\'t affect the video');
      advice.push('Check fal.ai service status');
      break;

    default:
      advice.push('Try refreshing the page and starting over');
      advice.push('Contact support if the problem persists');
  }

  if (!error.retryable) {
    advice.unshift('This error cannot be automatically retried');
  }

  return advice;
}

export class FallbackDataProvider {
  static getSampleDrugAnalysis(drugName: string) {
    return {
      drugName: drugName || 'Sample Medication',
      mechanismOfAction: `${drugName} works by targeting specific biological pathways in the body to provide therapeutic effects.`,
      videoScript: {
        segment1: `Meet ${drugName}, an important medication used in medical treatment. This drug has been extensively studied and proven effective for specific conditions.`,
        segment2: `${drugName} works at the molecular level by binding to specific receptors in your body. This interaction triggers beneficial biological responses.`,
        segment3: `Through its mechanism, ${drugName} provides therapeutic benefits by modulating key physiological processes, leading to improved health outcomes.`,
        segment4: `Always consult healthcare providers before using ${drugName}. Follow prescribed dosages and report any side effects to your doctor.`
      },
      keyPoints: [
        'Targets specific biological pathways',
        'Clinically proven effectiveness',
        'Requires medical supervision'
      ],
      safetyWarnings: [
        'Consult healthcare provider before use',
        'Follow prescribed dosage instructions',
        'Monitor for adverse reactions'
      ],
      imagePrompts: {
        mechanismDiagram: `Medical illustration of ${drugName} mechanism of action`,
        cellularAction: `Cellular view of ${drugName} drug interaction`,
        therapeuticEffect: `Therapeutic benefits of ${drugName} treatment`
      }
    };
  }

  static getSampleVideoSegments(drugName: string) {
    return [
      {
        segmentNumber: 1,
        prompt: `Introduction to ${drugName}`,
        videoUrl: 'data:video/mp4;base64,', // Placeholder
        duration: 8
      },
      {
        segmentNumber: 2,
        prompt: `${drugName} mechanism of action`,
        videoUrl: 'data:video/mp4;base64,', // Placeholder
        duration: 8
      },
      {
        segmentNumber: 3,
        prompt: `${drugName} therapeutic effects`,
        videoUrl: 'data:video/mp4;base64,', // Placeholder
        duration: 8
      },
      {
        segmentNumber: 4,
        prompt: `${drugName} safety information`,
        videoUrl: 'data:video/mp4;base64,', // Placeholder
        duration: 6
      }
    ];
  }
}