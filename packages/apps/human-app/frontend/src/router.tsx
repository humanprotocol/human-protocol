import { createBrowserRouter } from 'react-router-dom';
import { MainPage } from '@/pages/main.page';
import { Playground } from '@/pages/playground';

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
