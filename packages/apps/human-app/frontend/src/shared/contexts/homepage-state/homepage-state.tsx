import React, { createContext, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';

type HomePageStateType = 'welcome' | 'chooseSignUpAccountType';

interface HomePageStageContextProps {
  pageView: HomePageStateType;
  setPageView: (step: HomePageStateType) => void;
  isMainPage: boolean;
}

export const HomePageStateContext =
  createContext<HomePageStageContextProps | null>(null);

export function HomePageStateProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [pageView, setPageView] = useState<HomePageStateType>('welcome');

  const location = useLocation();
  const isMainPage =
    location.pathname === routerPaths.homePage && pageView === 'welcome';

  const contextValue = useMemo(
    () => ({ pageView, setPageView, isMainPage }),
    [pageView, setPageView, isMainPage]
  );

  return (
    <HomePageStateContext.Provider value={contextValue}>
      {children}
    </HomePageStateContext.Provider>
  );
}
