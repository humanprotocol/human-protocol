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
  ColorMode,
  hasColorMode,
  isDarkColorMode,
  saveColorMode,
} from './color-mode-settings';
import { addColorSchemePrefsListener } from './color-mode-handlers';

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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(isDarkColorMode());

  const handleColorSchemePrefsChange = (prefersDarkScheme: boolean) => {
    if (hasColorMode()) {
      return;
    }
    setIsDarkMode(prefersDarkScheme);
    if (prefersDarkScheme) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  useEffect(() => {
    const unsubscribe = addColorSchemePrefsListener(
      handleColorSchemePrefsChange
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const switchMode = useCallback(() => {
    setIsDarkMode((current) => {
      const newMode = !current;
      saveColorMode(newMode ? ColorMode.DARK : ColorMode.LIGHT);
      return newMode;
    });
  }, []);

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
