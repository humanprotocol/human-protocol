import type { ReactNode } from 'react';
import { createContext, useCallback, useEffect, useState } from 'react';
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

  const isGrayBackground = (() => {
    if (isDarkMode) {
      return backgroundColor === colorPalette.backgroundColor;
    }

    return backgroundColor === colorPalette.paper.main;
  })();

  const setWhiteBackground = useCallback(() => {
    setBackgroundColor(colorPalette.white);
  }, [colorPalette.white]);

  const setGrayBackground = () => {
    if (isDarkMode) {
      setBackgroundColor(colorPalette.backgroundColor);
    } else {
      setBackgroundColor(colorPalette.paper.main);
    }
  };

  const setGrayBackgroundInternal = useCallback(
    (_isDarkMode: boolean) => {
      if (isDarkMode) {
        setBackgroundColor(colorPalette.backgroundColor);
      } else {
        setBackgroundColor(colorPalette.paper.main);
      }
    },
    [colorPalette.backgroundColor, colorPalette.paper.main, isDarkMode]
  );

  useEffect(() => {
    if (isGrayBackground) {
      setGrayBackgroundInternal(isDarkMode);
    }
  }, [
    isGrayBackground,
    setWhiteBackground,
    isDarkMode,
    setGrayBackgroundInternal,
  ]);

  return (
    <BackgroundContext.Provider
      value={{ backgroundColor, setWhiteBackground, setGrayBackground }}
    >
      {children}
    </BackgroundContext.Provider>
  );
}
