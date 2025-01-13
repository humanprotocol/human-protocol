import type { ReactNode } from 'react';
import { createContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import { theme } from '@/shared/styles/theme';
import { colorPalette as defaultColorPalette } from '@/shared/styles/color-palette';
import { darkTheme } from '@/shared/styles/dark-theme';
import { darkColorPalette } from '@/shared/styles/dark-color-palette';
import { BackgroundProvider } from '@/shared/contexts/background-color-store';
import {
  isDarkInModeLocalStorage,
  setModeInLocalStorage,
  isModeSetILocalStorage,
} from '../helpers/dark-mode';

export interface ColorModeContextProps {
  isDarkMode: boolean;
  colorPalette: typeof defaultColorPalette;
  switchMode: () => void;
}

export const ColorModeContext = createContext<
  ColorModeContextProps | undefined
>(undefined);

interface ColorModeProviderProps {
  children: ReactNode;
}

export function ColorModeProvider({ children }: ColorModeProviderProps) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    isDarkInModeLocalStorage()
  );

  const switchMode = () => {
    setIsDarkMode((current) => {
      const newMode = !current;
      setModeInLocalStorage(newMode ? 'dark' : 'light');
      return newMode;
    });
  };

  const runColorMode = (
    fn: (matches: boolean) => void
  ): (() => void) | undefined => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    fn(query.matches);

    const listener = (event: MediaQueryListEvent) => {
      fn(event.matches);
    };
    query.addEventListener('change', listener);

    return () => {
      query.removeEventListener('change', listener);
    };
  };

  useEffect(() => {
    const handleColorModeChange = (matches: boolean) => {
      if (isModeSetILocalStorage()) {
        return;
      }
      setIsDarkMode(matches);
      if (matches) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    };

    const unsubscribe = runColorMode(handleColorModeChange);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);
  const themes = useMemo(
    () => (isDarkMode ? createTheme(darkTheme) : createTheme(theme)),
    [isDarkMode]
  );
  const colorPalette = useMemo(
    () => (isDarkMode ? darkColorPalette : defaultColorPalette),
    [isDarkMode]
  );
  return (
    <ThemeProvider theme={themes}>
      <ColorModeContext.Provider
        value={{ isDarkMode, colorPalette, switchMode }}
      >
        <BackgroundProvider colorPalette={colorPalette} isDarkMode={isDarkMode}>
          {children}
        </BackgroundProvider>
      </ColorModeContext.Provider>
    </ThemeProvider>
  );
}
