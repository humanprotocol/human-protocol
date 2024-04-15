import { createBrowserRouter } from 'react-router-dom';
import { MainPage } from '@/pages/main.page';
import { Playground } from '@/pages/playground/playground.page';
import { SignInWorker } from '@/pages/sign-in/sign-in-worker.page';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: MainPage,
  },
  {
    path: '/playground',
    Component: Playground,
  },
  {
    path: '/sign-in/worker',
    Component: SignInWorker,
  },
]);
