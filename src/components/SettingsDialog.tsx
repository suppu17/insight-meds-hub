import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Settings, Palette, RotateCcw } from 'lucide-react';
import ThemeSelector from './ThemeSelector';
import { useTheme } from '@/hooks/useTheme';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { currentTheme, availableThemes, changeTheme, resetToDefault } = useTheme();

  const handleResetTheme = () => {
    resetToDefault();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Customize your MedInsight experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Theme Settings Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <span className="font-medium">Appearance</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetTheme}
                className="text-xs rounded-xl shadow-lg"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </div>

            <Separator />

            <ThemeSelector
              availableThemes={availableThemes}
              currentTheme={currentTheme}
              onThemeChange={changeTheme}
            />
          </div>

          {/* Future Settings Sections */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Other Settings</span>
            </div>
            <Separator />
            <div className="text-sm text-muted-foreground p-4 border border-dashed border-border rounded-lg text-center">
              More settings options will be available here in future updates
            </div>
          </div>
        </div>

        {/* Dialog Footer */}
        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;