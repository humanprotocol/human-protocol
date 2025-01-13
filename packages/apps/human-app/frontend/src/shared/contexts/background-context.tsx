import { createContext } from 'react';

export interface BackgroundContextProps {
  backgroundColor: string;
  setWhiteBackground: () => void;
  setGrayBackground: () => void;
}

export const BackgroundContext = createContext<
  BackgroundContextProps | undefined
>(undefined);
