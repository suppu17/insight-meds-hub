import { useState, useCallback } from "react";
import { Upload, Camera, FileText, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFileUpload: (files: File[]) => void;
  onManualEntry: (medication: string) => void;
}

const UploadZone = ({ onFileUpload, onManualEntry }: UploadZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [uploadMode, setUploadMode] = useState<'upload' | 'manual'>('upload');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFileUpload(files);
    }
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFileUpload(files);
    }
  }, [onFileUpload]);

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onManualEntry(manualInput.trim());
      setManualInput("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex justify-center">
        <div className="glass-panel rounded-full p-1 inline-flex">
          <Button
            variant={uploadMode === 'upload' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setUploadMode('upload')}
            className="rounded-full px-6"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <Button
            variant={uploadMode === 'manual' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setUploadMode('manual')}
            className="rounded-full px-6"
          >
            <FileText className="w-4 h-4 mr-2" />
            Manual Entry
          </Button>
        </div>
      </div>

      {uploadMode === 'upload' ? (
        <div
          className={cn(
            "upload-zone cursor-pointer",
            isDragOver && "dragover"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input
            id="file-upload"
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="flex justify-center space-x-4">
              <div className="glass-panel rounded-full p-4">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <div className="glass-panel rounded-full p-4">
                <Pill className="w-8 h-8 text-accent" />
              </div>
              <div className="glass-panel rounded-full p-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                Upload Prescription or Medication Photo
              </h3>
              <p className="text-muted-foreground">
                Drag & drop your prescription, medication bottle, or documents here
              </p>
              <p className="text-sm text-muted-foreground">
                Supports: JPG, PNG, PDF • Max 20MB per file
              </p>
            </div>

            <Button className="medical" variant="medical" size="lg">
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="glass-panel rounded-full p-4 w-fit mx-auto">
              <Pill className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">
              Enter Medication Name
            </h3>
            <p className="text-muted-foreground">
              Type the medication name manually
            </p>
          </div>

          <div className="space-y-4">
            <Input
              placeholder="e.g., Aspirin, Metformin, Ibuprofen..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
              className="glass-panel border-0 text-lg py-6 text-center"
            />
            
            <Button
              onClick={handleManualSubmit}
              disabled={!manualInput.trim()}
              variant="medical"
              size="lg"
              className="w-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              Analyze Medication
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadZone;