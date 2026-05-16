'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  colorScheme: ColorScheme;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  colorScheme: 'light',
  setThemeMode: () => {},
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');

  useEffect(() => {
    const saved = localStorage.getItem('@theme_mode') as ThemeMode | null;
    if (saved) {
      setThemeModeState(saved);
    }
  }, []);

  useEffect(() => {
    if (themeMode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      setColorScheme(mq.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => setColorScheme(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      setColorScheme(themeMode);
    }
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorScheme);
  }, [colorScheme]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('@theme_mode', mode);
  }, []);

  return (
    <ThemeContext.Provider value={{ themeMode, colorScheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useAppTheme = () => useContext(ThemeContext);
