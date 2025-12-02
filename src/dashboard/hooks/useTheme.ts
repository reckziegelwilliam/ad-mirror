import { useState, useEffect } from 'react';
import { getCurrentSettings, updateSettings } from '../../shared/settings';

export type ThemeMode = 'system' | 'light' | 'dark';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Load theme from settings
  useEffect(() => {
    (async () => {
      const settings = await getCurrentSettings();
      setThemeState(settings.theme);
    })();
  }, []);

  // Resolve system theme
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateResolvedTheme = () => {
      if (theme === 'system') {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      } else {
        setResolvedTheme(theme);
      }
    };

    updateResolvedTheme();

    // Listen for system theme changes
    mediaQuery.addEventListener('change', updateResolvedTheme);
    return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  // Update theme
  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    await updateSettings({ theme: newTheme });
  };

  return { theme, resolvedTheme, setTheme };
}

