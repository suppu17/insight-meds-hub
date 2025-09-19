import React from 'react';
import { Check } from 'lucide-react';
import { ThemePalette } from '@/lib/themes';

interface ThemeSelectorProps {
  availableThemes: ThemePalette[];
  currentTheme: ThemePalette;
  onThemeChange: (themeId: string) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  availableThemes,
  currentTheme,
  onThemeChange
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Color Theme</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose your preferred color palette for the interface
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {availableThemes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            className={`relative group rounded-lg p-3 border-2 transition-all duration-200 hover:scale-105 ${
              currentTheme.id === theme.id
                ? 'border-primary shadow-lg'
                : 'border-border hover:border-muted-foreground'
            }`}
            title={theme.description}
          >
            {/* Color Swatches */}
            <div className="space-y-2">
              {/* Primary Color Row */}
              <div className="flex gap-1">
                <div
                  className="w-8 h-4 rounded-sm"
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <div
                  className="w-8 h-4 rounded-sm"
                  style={{ backgroundColor: theme.colors.secondary }}
                />
              </div>

              {/* Background and Accent Row */}
              <div className="flex gap-1">
                <div
                  className="w-8 h-4 rounded-sm border border-gray-600/30"
                  style={{ backgroundColor: theme.colors.background }}
                />
                <div
                  className="w-8 h-4 rounded-sm"
                  style={{ backgroundColor: theme.colors.accent }}
                />
              </div>
            </div>

            {/* Theme Name */}
            <div className="mt-3 text-xs font-medium text-foreground text-center">
              {theme.name}
            </div>

            {/* Selected Indicator */}
            {currentTheme.id === theme.id && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}

            {/* Hover Effect */}
            <div className="absolute inset-0 rounded-lg bg-background/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </button>
        ))}
      </div>

      {/* Current Theme Info */}
      <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <div
              className="w-4 h-4 rounded-full border border-gray-600/30"
              style={{ backgroundColor: currentTheme.colors.primary }}
            />
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: currentTheme.colors.accent }}
            />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">
              {currentTheme.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {currentTheme.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;