import React, { createContext, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';
import { type HomePageStateType } from '../types/homepage-state';

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
