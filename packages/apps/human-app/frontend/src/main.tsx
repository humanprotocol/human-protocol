import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import '@/i18n/i18n';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '@/styles/theme';
import { router } from './router';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/900.css';

const root = document.getElementById('root');
if (!root) throw Error('root element is undefined');

const queryClient = new QueryClient();

let themes = createTheme(theme);
themes = responsiveFontSizes(themes);

createRoot(root).render(
  <StrictMode>
    <ThemeProvider theme={themes}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
