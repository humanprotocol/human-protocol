import type { RouteProps } from 'react-router-dom';
import { MainPage } from '@/pages/main.page';
import { Playground } from '@/pages/playground/playground.page';
import { ProtectedPage } from '@/pages/protected.page';
import { SignUpWorkerPage } from '@/pages/worker/sign-up.page';

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
    path: '/worker/sign-up',
    element: <SignUpWorkerPage />,
  },
];

export const protectedRoutes: RouteProps[] = [
  {
    path: '/protected',
    element: <ProtectedPage />,
  },
];
