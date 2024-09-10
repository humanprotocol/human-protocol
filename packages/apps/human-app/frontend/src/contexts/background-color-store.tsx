import type { ReactNode } from 'react';
import { createContext, useState } from 'react';
import type { ColorPalette } from '@/styles/color-palette';

export interface BackgroundContextProps {
  backgroundColor: string;
  setWhiteBackground: () => void;
  setGrayBackground: () => void;
}

export const BackgroundContext = createContext<
  BackgroundContextProps | undefined
>(undefined);

interface BackgroundProviderProps {
  children: ReactNode;
  colorPalette: ColorPalette;
  isDarkMode: boolean;
}

export function BackgroundProvider({
  children,
  colorPalette,
  isDarkMode,
}: BackgroundProviderProps) {
  const [backgroundColor, setBackgroundColor] = useState<string>(
    colorPalette.white
  );

  const setWhiteBackground = () => {
    setBackgroundColor(colorPalette.white);
  };

  const setGrayBackground = () => {
    if (isDarkMode) {
      setBackgroundColor(colorPalette.backgroundColor);
    } else {
      setBackgroundColor(colorPalette.paper.main);
    }
  };

  return (
    <BackgroundContext.Provider
      value={{ backgroundColor, setWhiteBackground, setGrayBackground }}
    >
      {children}
    </BackgroundContext.Provider>
  );
}
