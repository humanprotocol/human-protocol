import { createBrowserRouter } from 'react-router-dom';
import HomePage from 'src/pages/Home';
import RequestPage from 'src/pages/Request';
import SubmitPage from 'src/pages/Submit';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/request',
    element: <RequestPage />,
  },
  {
    path: '/submit',
    element: <SubmitPage />,
  },
]);
