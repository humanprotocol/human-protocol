import type { ReactNode } from 'react';
import {
  createContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import { theme } from '@/shared/styles/theme';
import { colorPalette as defaultColorPalette } from '@/shared/styles/color-palette';
import { darkTheme } from '@/shared/styles/dark-theme';
import { darkColorPalette } from '@/shared/styles/dark-color-palette';
import { BackgroundProvider } from '@/shared/contexts/background-color-store';
import {
  isDarkColorModeEnabledInLocalStorage,
  saveColorModeStateInLocalStorage,
  isColorModeStateSavedInLocalStorage,
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

export function ColorModeProvider({
  children,
}: Readonly<ColorModeProviderProps>) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    isDarkColorModeEnabledInLocalStorage()
  );

  useEffect(() => {
    const handleColorModeChange = (matches: boolean) => {
      if (isColorModeStateSavedInLocalStorage()) {
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

  const switchMode = useCallback(() => {
    setIsDarkMode((current) => {
      const newMode = !current;
      saveColorModeStateInLocalStorage(newMode ? 'dark' : 'light');
      return newMode;
    });
  }, []);

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

  const themes = useMemo(
    () => (isDarkMode ? createTheme(darkTheme) : createTheme(theme)),
    [isDarkMode]
  );
  const colorPalette = useMemo(
    () => (isDarkMode ? darkColorPalette : defaultColorPalette),
    [isDarkMode]
  );
  const contextValue = useMemo(
    () => ({ isDarkMode, colorPalette, switchMode }),
    [isDarkMode, colorPalette, switchMode]
  );

  return (
    <ThemeProvider theme={themes}>
      <ColorModeContext.Provider value={contextValue}>
        <BackgroundProvider colorPalette={colorPalette} isDarkMode={isDarkMode}>
          {children}
        </BackgroundProvider>
      </ColorModeContext.Provider>
    </ThemeProvider>
  );
}
