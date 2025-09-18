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
    <div className="space-y-4">
      {/* Upload Image Row */}
      <div className="glass-card p-6 cursor-pointer hover:bg-primary/5 transition-colors">
        <div className="flex items-center gap-4">
          <div className="glass-panel rounded-full p-3">
            <Camera className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">Upload Image</h3>
            <p className="text-sm text-muted-foreground">Take or upload a photo of your medication</p>
          </div>
        </div>
      </div>

      {/* Enter Medication Name Row */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-4">
          <div className="glass-panel rounded-full p-3">
            <Pill className="w-6 h-6 text-accent" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Enter Medication Name</h3>
              <p className="text-sm text-muted-foreground">Type the medication name manually</p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., Aspirin, Metformin, Ibuprofen..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                className="glass-panel border-0 flex-1"
              />
              <Button
                onClick={handleManualSubmit}
                disabled={!manualInput.trim()}
                variant="medical"
                size="sm"
              >
                Analyze
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Choose Files Row */}
      <div 
        className={cn(
          "glass-card p-6 cursor-pointer hover:bg-primary/5 transition-colors",
          isDragOver && "bg-primary/10 border-primary/30"
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
        <div className="flex items-center gap-4">
          <div className="glass-panel rounded-full p-3">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">Choose Files to Upload Prescription</h3>
            <p className="text-sm text-muted-foreground">Upload prescription documents or medication photos</p>
            <p className="text-xs text-muted-foreground mt-1">Supports: JPG, PNG, PDF • Max 20MB per file</p>
          </div>
          <Button variant="medical" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Browse Files
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UploadZone;