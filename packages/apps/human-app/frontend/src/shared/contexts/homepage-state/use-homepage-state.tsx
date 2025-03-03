import { useContext } from 'react';
import { HomePageStateContext } from './homepage-state';

export const useHomePageState = () => {
  const context = useContext(HomePageStateContext);
  if (!context) {
    throw new Error(
      'useHomePageState must be used within a HomePageStageProvider'
    );
  }
  return context;
};
