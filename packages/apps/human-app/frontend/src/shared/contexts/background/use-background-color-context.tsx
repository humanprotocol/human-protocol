import { useContext } from 'react';
import { BackgroundContext, type BackgroundContextProps } from './background';

export const useBackgroundColorContext = (): BackgroundContextProps => {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error(
      'useBackgroundColor must be used within a BackgroundProvider'
    );
  }
  return context;
};
