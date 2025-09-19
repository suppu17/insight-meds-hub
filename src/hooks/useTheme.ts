import { useState, useEffect } from 'react';
import { ThemePalette, themes, getThemeById, applyTheme } from '@/lib/themes';

const THEME_STORAGE_KEY = 'medinsight-theme';
const DEFAULT_THEME_ID = 'orange-black';

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<ThemePalette>(
    () => getThemeById(DEFAULT_THEME_ID) || themes[0]
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY);

    if (savedThemeId) {
      const savedTheme = getThemeById(savedThemeId);
      if (savedTheme) {
        setCurrentTheme(savedTheme);
        applyTheme(savedTheme);
      }
    } else {
      // Apply default theme
      const defaultTheme = getThemeById(DEFAULT_THEME_ID) || themes[0];
      applyTheme(defaultTheme);
    }

    setIsLoaded(true);
  }, []);

  const changeTheme = (themeId: string) => {
    const newTheme = getThemeById(themeId);
    if (!newTheme) {
      console.error(`Theme with id "${themeId}" not found`);
      return;
    }

    setCurrentTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  };

  const resetToDefault = () => {
    const defaultTheme = getThemeById(DEFAULT_THEME_ID) || themes[0];
    setCurrentTheme(defaultTheme);
    applyTheme(defaultTheme);
    localStorage.removeItem(THEME_STORAGE_KEY);
  };

  return {
    currentTheme,
    availableThemes: themes,
    changeTheme,
    resetToDefault,
    isLoaded
  };
};