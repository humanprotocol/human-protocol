import type { RouteProps } from 'react-router-dom';
import { HomePage } from '@/pages/homepage/home.page';
import { Playground } from '@/pages/playground/playground.page';
import { ProtectedPage } from '@/pages/protected.page';
import { SignInWorkerPage } from '@/pages/worker/sign-in.page';
import { SignUpWorkerPage } from '@/pages/worker/sign-up.page';

export const unprotectedRoutes: RouteProps[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/playground',
    element: <Playground />,
  },
  {
    path: '/worker/sign-in',
    element: <SignInWorkerPage />,
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
