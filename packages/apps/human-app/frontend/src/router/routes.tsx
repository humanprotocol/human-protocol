import type { RouteProps } from 'react-router-dom';
import { HomePage } from '@/pages/homepage/home.page';
import { Playground } from '@/pages/playground/playground.page';
import { ProtectedPage } from '@/pages/protected.page';
import { SignInWorkerPage } from '@/pages/worker/sign-in.page';
import { SignUpWorkerPage } from '@/pages/worker/sign-up.page';
import { SignInOperatorPage } from '@/pages/operator/sign-in.page';
import { SignUpOperatorPage } from '@/pages/operator/sign-up.page';
import { routerPaths } from '@/router/router-paths';
import { JobsPage } from '@/pages/worker/jobs/jobs.page';

export const unprotectedRoutes: RouteProps[] = [
  {
    path: routerPaths.homePage,
    element: <HomePage />,
  },
  {
    path: routerPaths.playground,
    element: <Playground />,
  },
  {
    path: routerPaths.worker.signIn,
    element: <SignInWorkerPage />,
  },
  {
    path: routerPaths.worker.signUp,
    element: <SignUpWorkerPage />,
  },
  {
    path: routerPaths.operator.signIn,
    element: <SignInOperatorPage />,
  },
  {
    path: routerPaths.operator.signUp,
    element: <SignUpOperatorPage />,
  },
];

export const protectedRoutes: RouteProps[] = [
  {
    path: '/protected',
    element: <ProtectedPage />,
  },
  {
    path: '/worker/jobs',
    element: <JobsPage />,
  },
];
