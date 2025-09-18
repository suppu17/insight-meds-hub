import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { createAWSCredentials } from './bearer-auth';

// Initialize AWS Bedrock client with fallback credentials
function createBedrockClient() {
  try {
    // Try bearer token first
    const bearerToken = import.meta.env.AWS_BEARER_TOKEN_BEDROCK;
    if (bearerToken) {
      console.log('🔐 Using bearer token for Bedrock authentication');
      const credentials = createAWSCredentials(bearerToken);
      return new BedrockRuntimeClient({
        region: credentials.region,
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
        }
      });
    }

    // Fallback to environment variables
    const accessKeyId = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
    const secretAccessKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;

    if (accessKeyId && secretAccessKey) {
      console.log('🔐 Using environment variables for Bedrock authentication');
      return new BedrockRuntimeClient({
        region: import.meta.env.VITE_AWS_REGION || "us-east-1",
        credentials: { accessKeyId, secretAccessKey }
      });
    }

    throw new Error('No valid AWS credentials found for Bedrock');
  } catch (error) {
    console.warn('❌ Failed to create Bedrock client:', error);
    return null;
  }
}

const client = createBedrockClient();

export interface DrugAnalysisResult {
  drugName: string;
  mechanismOfAction: string;
  videoScript: {
    segment1: string; // 0-8s: Introduction
    segment2: string; // 8-16s: Mechanism details
    segment3: string; // 16-24s: Therapeutic effects
    segment4: string; // 24-30s: Safety and summary
  };
  keyPoints: string[];
  safetyWarnings: string[];
  imagePrompts: {
    mechanismDiagram: string;
    cellularAction: string;
    therapeuticEffect: string;
  };
}

/**
 * Analyze drug and generate comprehensive educational content
 */
/**
 * Clean JSON content by removing markdown code block wrappers
 */
function cleanJsonContent(content: string): string {
  return content
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .replace(/^[\s\n]*/, '')  // Remove leading whitespace
    .replace(/[\s\n]*$/, '')  // Remove trailing whitespace
    .trim();
}

/**
 * Create mock analysis result for testing when Bedrock is not available
 */
function createMockAnalysis(drugName: string): DrugAnalysisResult {
  return {
    drugName: drugName,
    mechanismOfAction: `${drugName} works by inhibiting specific enzymes and modulating cellular pathways to achieve its therapeutic effects. This medication targets key molecular mechanisms to provide effective treatment while maintaining safety profiles.`,
    videoScript: {
      segment1: `Introduction to ${drugName}: A widely used medication with proven efficacy in treating various conditions through targeted molecular action.`,
      segment2: `${drugName} binds to specific receptors and inhibits key enzymes, blocking inflammatory pathways and modulating cellular responses for therapeutic benefit.`,
      segment3: `The medication provides rapid symptom relief, reduces inflammation, and helps restore normal physiological function through its multi-target approach.`,
      segment4: `${drugName} has an excellent safety profile when used as directed. Always consult healthcare providers and follow prescribed dosing guidelines.`
    },
    keyPoints: [
      `${drugName} provides effective symptom relief`,
      "Works through targeted enzyme inhibition",
      "Has well-established safety profile",
      "Available in multiple formulations"
    ],
    safetyWarnings: [
      "May cause side effects in some patients",
      "Consult healthcare provider before use",
      "Follow prescribed dosing instructions",
      "Report any adverse reactions"
    ],
    imagePrompts: {
      mechanismDiagram: `Medical illustration showing ${drugName} molecular structure and target binding sites in cellular pathways`,
      cellularAction: `Microscopic view of ${drugName} interacting with cellular receptors and enzyme systems`,
      therapeuticEffect: `Clinical visualization of ${drugName} therapeutic effects and patient improvement outcomes`
    }
  };
}

export async function analyzeDrugMechanism(drugName: string): Promise<DrugAnalysisResult> {
  // If Bedrock client is not available, use mock data
  if (!client) {
    console.warn('🔄 Bedrock client not available, using mock analysis for:', drugName);
    return createMockAnalysis(drugName);
  }
  const prompt = `
You are a medical AI assistant specialized in pharmacology. Analyze the drug "${drugName}" and provide comprehensive educational content for a 30-second video explanation.

Please provide a JSON response with the following structure:

{
  "drugName": "${drugName}",
  "mechanismOfAction": "Brief overview of how the drug works",
  "videoScript": {
    "segment1": "8-second script for drug introduction and basic information (conversational, engaging)",
    "segment2": "8-second script explaining the mechanism of action at cellular/molecular level",
    "segment3": "8-second script covering therapeutic effects and clinical benefits",
    "segment4": "6-second script with safety considerations and summary"
  },
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "safetyWarnings": ["Warning 1", "Warning 2"],
  "imagePrompts": {
    "mechanismDiagram": "Detailed prompt for generating a scientific diagram of the drug's mechanism",
    "cellularAction": "Prompt for showing cellular-level drug action",
    "therapeuticEffect": "Prompt for illustrating therapeutic benefits"
  }
}

Requirements:
1. Each video script segment should be exactly timed for the specified duration
2. Use clear, educational language suitable for patients and students
3. Include proper medical terminology but make it accessible
4. Focus on visual storytelling for video generation
5. Ensure scientific accuracy
6. Include appropriate medical disclaimers in safety warnings

Respond with valid JSON only, no additional text.
`;

  try {
    const command = new ConverseCommand({
      modelId: "us.amazon.nova-premier-v1:0",
      messages: [
        {
          role: "user",
          content: [{ text: prompt }]
        }
      ],
      system: [{
        text: "You are a medical AI assistant specialized in pharmacology. Always respond with valid JSON in the requested format."
      }],
      inferenceConfig: {
        maxTokens: 4000,
        temperature: 0.3
      }
    });

    const response = await client.send(command);
    
    if (!response.output?.message?.content?.[0]?.text) {
      throw new Error('No content returned from Amazon Bedrock');
    }

    // Extract the content from the response
    const content = response.output.message.content[0].text;

    // Clean the content to remove markdown code blocks
    const cleanedContent = cleanJsonContent(content);

    // Parse the JSON response
    const analysisResult: DrugAnalysisResult = JSON.parse(cleanedContent);

    // Validate the response structure
    if (!analysisResult.drugName || !analysisResult.videoScript || !analysisResult.mechanismOfAction) {
      throw new Error("Invalid response structure from Claude");
    }

    return analysisResult;
  } catch (error) {
    console.error("Error analyzing drug with Bedrock:", error);

    // Check if it's a credentials/authentication error
    if (error instanceof Error && (
      error.message.includes('security token') ||
      error.message.includes('UnrecognizedClientException') ||
      error.message.includes('InvalidAccessKeyId') ||
      error.message.includes('credentials')
    )) {
      console.warn('🔄 Bedrock authentication failed, using mock analysis for:', drugName);
      return createMockAnalysis(drugName);
    }

    // Fallback response for any other errors
    console.warn('🔄 Bedrock request failed, using mock analysis for:', drugName);
    return createMockAnalysis(drugName);
  }
}

/**
 * Generate enhanced prompts for video segments with visual storytelling elements
 */
export async function enhanceVideoPrompts(
  drugAnalysis: DrugAnalysisResult
): Promise<string[]> {
  const basePrompts = [
    `Medical education video: ${drugAnalysis.videoScript.segment1} Show pills, medical setting, friendly healthcare professional explaining medication basics. Clean, professional medical environment.`,

    `Medical animation: ${drugAnalysis.videoScript.segment2} Visualize drug mechanism with 3D molecular animation, cellular receptors, drug binding process. Scientific accuracy with engaging visuals.`,

    `Healthcare visualization: ${drugAnalysis.videoScript.segment3} Show therapeutic benefits through before/after patient scenarios, improved health indicators, positive treatment outcomes. Uplifting medical narrative.`,

    `Medical safety video: ${drugAnalysis.videoScript.segment4} Healthcare consultation scene, doctor-patient discussion, medication safety information, professional medical advice setting.`
  ];

  return basePrompts;
}

/**
 * Check if AWS credentials are configured
 */
export function checkBedrockConfiguration(): boolean {
  const accessKey = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
  const secretKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;
  const region = import.meta.env.VITE_AWS_REGION;

  return !!(accessKey && secretKey && region);
}