import { useContext } from 'react';
import type { ColorModeContextProps } from '@/shared/contexts/color-mode';
import { ColorModeContext } from '@/shared/contexts/color-mode';

export const useColorMode = (): ColorModeContextProps => {
  const context = useContext(ColorModeContext);
  if (!context) {
    throw new Error('useColorMode must be used within a ColorModeProvider');
  }
  return context;
};
