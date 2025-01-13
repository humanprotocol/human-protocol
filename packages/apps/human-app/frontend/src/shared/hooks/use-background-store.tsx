import { useContext } from 'react';
import {
  type BackgroundContextProps,
  BackgroundContext,
} from '../contexts/background-context';

export const useBackgroundColorStore = (): BackgroundContextProps => {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error(
      'useBackgroundColor must be used within a BackgroundProvider'
    );
  }
  return context;
};
