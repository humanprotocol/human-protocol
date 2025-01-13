import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';
import type { ColorPalette } from '@/shared/styles/color-palette';
import { BackgroundContext } from '../contexts/background-context';

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
