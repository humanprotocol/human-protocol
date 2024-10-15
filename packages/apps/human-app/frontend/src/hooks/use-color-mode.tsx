import { useContext } from 'react';
import type { ColorModeContextProps } from '@/contexts/color-mode-context';
import { ColorModeContext } from '@/contexts/color-mode-context';

export const useColorMode = (): ColorModeContextProps => {
  const context = useContext(ColorModeContext);
  if (!context) {
    throw new Error('useColorMode must be used within a ColorModeProvider');
  }
  return context;
};
