import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Image,
  Loader2,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Brain,
  Eye,
  Microscope
} from 'lucide-react';
import { generateMechanismImage, ImageGenerationResult } from '@/lib/api/fal';
import { DrugAnalysisResult } from '@/lib/api/bedrock';

interface PicturizeImageGeneratorProps {
  drugName: string;
  drugAnalysis?: DrugAnalysisResult | null;
}

interface GeneratedImage {
  url: string;
  title: string;
  description: string;
  isLoading: boolean;
  error?: string;
}

const PicturizeImageGenerator: React.FC<PicturizeImageGeneratorProps> = ({
  drugName,
  drugAnalysis
}) => {
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');

  // Default image prompts if drugAnalysis is not available
  const getImagePrompts = () => {
    if (drugAnalysis?.imagePrompts) {
      return [
        {
          title: "Molecular Structure",
          prompt: drugAnalysis.imagePrompts.molecularStructure || `Detailed molecular structure of ${drugName} showing chemical bonds and atoms in 3D, scientific illustration style`,
          icon: Microscope
        },
        {
          title: "Mechanism Diagram",
          prompt: drugAnalysis.imagePrompts.mechanismDiagram || `Medical diagram showing how ${drugName} works in the human body at cellular level, educational illustration`,
          icon: Brain
        },
        {
          title: "Therapeutic Effects",
          prompt: drugAnalysis.imagePrompts.therapeuticEffects || `Visualization of ${drugName} therapeutic effects and benefits in the human body, medical infographic style`,
          icon: Eye
        }
      ];
    }

    // Fallback prompts
    return [
      {
        title: "Molecular Structure",
        prompt: `Detailed molecular structure of ${drugName} medication showing chemical formula and atomic bonds, scientific medical illustration, clean white background, high quality`,
        icon: Microscope
      },
      {
        title: "Mechanism Diagram",
        prompt: `Medical diagram showing how ${drugName} works inside human cells, mechanism of action illustration, educational style, clear and simple`,
        icon: Brain
      },
      {
        title: "Therapeutic Effects",
        prompt: `Medical illustration showing the therapeutic effects of ${drugName} in the human body, before and after comparison, patient-friendly visualization`,
        icon: Eye
      }
    ];
  };

  // Initialize images array
  useEffect(() => {
    const prompts = getImagePrompts();
    setImages(prompts.map((prompt, index) => ({
      url: '',
      title: prompt.title,
      description: prompt.prompt,
      isLoading: false,
      error: undefined
    })));
  }, [drugName, drugAnalysis]);

  // Auto-start image generation after images are initialized
  useEffect(() => {
    if (images.length > 0 && (drugAnalysis || drugName)) {
      // Automatically start image generation after component mounts
      const timer = setTimeout(() => {
        generateAllImages();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [images.length, drugName, drugAnalysis]);

  const generateImage = async (index: number) => {
    const prompts = getImagePrompts();
    if (index >= prompts.length) return;

    const prompt = prompts[index];

    // Update loading state for this specific image
    setImages(prev => prev.map((img, i) =>
      i === index ? { ...img, isLoading: true, error: undefined } : img
    ));

    try {
      setGenerationProgress(`Generating ${prompt.title.toLowerCase()}...`);

      const result: ImageGenerationResult = await generateMechanismImage(
        prompt.prompt,
        {
          numImages: 1,
          outputFormat: "jpeg"
        }
      );

      if (result.images && result.images.length > 0) {
        setImages(prev => prev.map((img, i) =>
          i === index ? {
            ...img,
            url: result.images[0].url,
            isLoading: false
          } : img
        ));
      } else {
        throw new Error('No images generated');
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      setImages(prev => prev.map((img, i) =>
        i === index ? {
          ...img,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Generation failed'
        } : img
      ));
    }
  };

  const generateAllImages = async () => {
    setIsGenerating(true);
    setGenerationProgress('Starting image generation...');

    try {
      // Generate images sequentially to avoid overwhelming the API
      for (let i = 0; i < images.length; i++) {
        await generateImage(i);
        // Small delay between generations
        if (i < images.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };

  const downloadImage = async (imageUrl: string, title: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${drugName}-${title.replace(/\s+/g, '-').toLowerCase()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const prompts = getImagePrompts();

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Image className="w-6 h-6 text-green-600" />
          AI-Generated Illustrations
        </h3>
        <div className="flex gap-2">
          <Button
            onClick={generateAllImages}
            disabled={isGenerating}
            variant="outline"
            size="sm"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Single consolidated generation status */}
      {(isGenerating || generationProgress || (!isGenerating && images.every(img => !img.url && !img.error))) && (
        <div className="mb-6 p-4 glass-panel rounded-lg bg-blue/5 border-blue/20">
          <div className="flex items-center gap-3">
            <div className="animate-spin">
              <Loader2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">
                {generationProgress || 'Generating AI Illustrations'}
              </p>
              <p className="text-sm text-blue-700">
                Creating molecular structure, mechanism diagram, and therapeutic effects visualizations...
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {images.map((image, index) => {
          const IconComponent = prompts[index].icon;
          return (
            <div key={index} className="space-y-4">
              <div className="flex items-center gap-2">
                <IconComponent className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-sm">{image.title}</h4>
              </div>

              <div className="aspect-square bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg border border-green/20 overflow-hidden">
                {image.isLoading ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-4">
                      <Loader2 className="w-12 h-12 mx-auto text-green-600 mb-2 animate-spin" />
                      <p className="text-xs text-green-600 font-medium">
                        Generating...
                      </p>
                    </div>
                  </div>
                ) : image.error ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-4">
                      <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-2" />
                      <p className="text-xs text-red-600 font-medium mb-2">
                        Generation Failed
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateImage(index)}
                        className="text-xs"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : image.url ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        setImages(prev => prev.map((img, i) =>
                          i === index ? {
                            ...img,
                            error: 'Failed to load image'
                          } : img
                        ));
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        size="sm"
                        onClick={() => downloadImage(image.url, image.title)}
                        className="bg-white/90 text-black hover:bg-white"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs bg-green-600 text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ready
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-4">
                      <Image className="w-12 h-12 mx-auto text-green-600 mb-2" />
                      <p className="text-xs text-muted-foreground mb-2">
                        Click "Generate Images" to create
                      </p>
                      <p className="text-xs text-green-600 font-medium">
                        {image.title}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground line-clamp-3">
                {image.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Image className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Automatic Visual Learning</h4>
            <p className="text-sm text-blue-700">
              AI illustrations are generated automatically to help visualize how {drugName} works at the molecular level.
              Each image shows different aspects: molecular structure, mechanism of action, and therapeutic effects.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                ✨ Auto-Generated
              </Badge>
              <Badge variant="outline" className="text-xs">
                🧬 Molecular Level
              </Badge>
              <Badge variant="outline" className="text-xs">
                📚 Educational
              </Badge>
              <Badge variant="outline" className="text-xs">
                💾 Downloadable
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PicturizeImageGenerator;