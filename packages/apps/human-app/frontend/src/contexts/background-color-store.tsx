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
}

export function BackgroundProvider({
  children,
  colorPalette,
}: BackgroundProviderProps) {
  const [backgroundColor, setBackgroundColor] = useState<string>(
    colorPalette.white
  );

  const setWhiteBackground = () => {
    setBackgroundColor(colorPalette.white);
  };

  const setGrayBackground = () => {
    setBackgroundColor(colorPalette.paper.main);
  };

  return (
    <BackgroundContext.Provider
      value={{ backgroundColor, setWhiteBackground, setGrayBackground }}
    >
      {children}
    </BackgroundContext.Provider>
  );
}
