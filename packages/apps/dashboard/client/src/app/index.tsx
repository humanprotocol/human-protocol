import { StrictMode } from 'react';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReactDOM from 'react-dom/client';

import AppRoutes from './AppRoutes';
import ThemeProvider from './providers/ThemeProvider';
import './styles/main.scss';
import 'simplebar-react/dist/simplebar.min.css';

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: { retry: 0 },
    queries: { retry: 0, refetchOnWindowFocus: false },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <StrictMode>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <QueryClientProvider client={queryClient}>
          <AppRoutes />
        </QueryClientProvider>
      </LocalizationProvider>
    </StrictMode>
  </ThemeProvider>
);
