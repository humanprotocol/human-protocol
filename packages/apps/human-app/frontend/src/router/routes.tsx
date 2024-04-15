import type { RouteProps } from 'react-router-dom';
import { MainPage } from '@/pages/main.page';
import { Playground } from '@/pages/playground/playground.page';
import { ProtectedPage } from '@/pages/protected.page';
import { SignInWorker } from '@/pages/sign-in/sign-in-worker.page';

export const unprotectedRoutes: RouteProps[] = [
  {
    path: '/',
    element: <MainPage />,
  },
  {
    path: '/playground',
    element: <Playground />,
  },
  {
    path: '/sign-in/worker',
    element: <SignInWorker />,
  },
];

export const protectedRoutes: RouteProps[] = [
  {
    path: '/protected',
    element: <ProtectedPage />,
  },
];
