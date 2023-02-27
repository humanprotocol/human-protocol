import { createBrowserRouter } from 'react-router-dom';
import HomePage from 'src/pages/Home';
import RequestPage from 'src/pages/Request';
import FortuneJobsPage from 'src/pages/FortuneJobs';
import FortuneJobPage from 'src/pages/FortuneJob';

export const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/request', element: <RequestPage /> },
  { path: '/jobs', element: <FortuneJobsPage /> },
  { path: '/jobs/:address', element: <FortuneJobPage /> },
]);
