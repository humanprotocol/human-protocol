import { useContext } from 'react';
import type { BackgroundContextProps } from '@/contexts/background-color-store';
import { BackgroundContext } from '@/contexts/background-color-store';

export const useBackgroundColorStore = (): BackgroundContextProps => {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error(
      'useBackgroundColor must be used within a BackgroundProvider'
    );
  }
  return context;
};
