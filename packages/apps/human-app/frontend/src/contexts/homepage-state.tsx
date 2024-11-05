import React, { createContext, useState, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';

export type HomePageStateType = 'welcome' | 'chooseSignUpAccountType';

interface HomePageStageContextProps {
  pageView: HomePageStateType;
  setPageView: (step: HomePageStateType) => void;
  isMainPage: boolean;
}

export const HomePageStateContext =
  createContext<HomePageStageContextProps | null>(null);

export function HomePageStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pageView, setPageView] = useState<HomePageStateType>('welcome');

  const location = useLocation();
  const isMainPage =
    location.pathname === routerPaths.homePage && pageView === 'welcome';

  return (
    <HomePageStateContext.Provider
      value={{ pageView, setPageView, isMainPage }}
    >
      {children}
    </HomePageStateContext.Provider>
  );
}

export const useHomePageState = () => {
  const context = useContext(HomePageStateContext);
  if (!context) {
    throw new Error(
      'useHomePageState must be used within a HomePageStageProvider'
    );
  }
  return context;
};
