import {
  createContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { ThemeProvider } from '@mui/material';

import {
  ColorMode,
  hasColorMode,
  isDarkColorMode,
  saveColorMode,
} from './color-mode-settings';
import { addColorSchemePrefsListener } from './color-mode-handlers';
import { createAppTheme } from '@/shared/styles/theme';

export interface ColorModeContextProps {
  isDarkMode: boolean;
  switchMode: () => void;
}

export const ColorModeContext = createContext<
  ColorModeContextProps | undefined
>(undefined);

interface ColorModeProviderProps {
  children: ReactNode;
}

export function ColorModeProvider({ children }: ColorModeProviderProps) {
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

  const theme = useMemo(
    () => createAppTheme(isDarkMode ? ColorMode.DARK : ColorMode.LIGHT),
    [isDarkMode]
  );

  const contextValue = useMemo(
    () => ({ isDarkMode, switchMode }),
    [isDarkMode, switchMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <ColorModeContext.Provider value={contextValue}>
        {children}
      </ColorModeContext.Provider>
    </ThemeProvider>
  );
}
