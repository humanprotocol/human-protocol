import { createBrowserRouter } from 'react-router-dom';
import { MainPage } from '@/pages/main.page';
import { Playground } from '@/pages/playground/playground.page';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: MainPage,
  },
  {
    path: '/playground',
    Component: Playground,
  },
]);
