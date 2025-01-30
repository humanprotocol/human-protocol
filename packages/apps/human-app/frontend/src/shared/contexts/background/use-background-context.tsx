import { useContext } from 'react';
import { BackgroundContext, type BackgroundContextProps } from './background';

export const useBackgroundContext = (): BackgroundContextProps => {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error(
      'useBackgroundContext must be used within a BackgroundProvider'
    );
  }
  return context;
};
