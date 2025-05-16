import React from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';

import SnackbarProvider from './providers/SnackProvider';
import { WagmiProvider } from './providers/WagmiProvider';
import { QueryClientProvider } from './providers/QueryClientProvider';
import { StakeProvider } from './contexts/stake';
import { KVStoreProvider } from './contexts/kvstore';
import ThemeProvider from './providers/ThemeProvider';

import App from './App';
import 'simplebar-react/dist/simplebar.min.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <WagmiProvider>
      <QueryClientProvider>
        <ThemeProvider>
          <Router>
            <CssBaseline />
            <SnackbarProvider>
              <StakeProvider>
                <KVStoreProvider>
                  <App />
                </KVStoreProvider>
              </StakeProvider>
            </SnackbarProvider>
          </Router>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
