import {
  FC,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import MuiThemeProvider from '@mui/material/styles/ThemeProvider';

import { createAppTheme } from '@/shared/ui/theme';

const THEME_STORAGE_KEY = 'dashboard-app-theme-mode';
const RELEASE_DARK_MODE = false; // TODO: remove this once we release the dark mode

const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    if (!RELEASE_DARK_MODE) return 'light';

    const savedMode = localStorage.getItem(THEME_STORAGE_KEY) as PaletteMode;
    if (savedMode) return savedMode;

    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setMode(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, [mode]);

  const toggleColorMode = useCallback(() => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  }, []);

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const extendedTheme = useMemo(
    () => ({
      ...theme,
      isDarkMode: mode === 'dark',
      toggleColorMode,
    }),
    [theme, mode, toggleColorMode]
  );

  return (
    <MuiThemeProvider theme={extendedTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};

export default ThemeProvider;
