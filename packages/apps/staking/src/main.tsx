import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import SnackbarProvider from './providers/SnackProvider';
import './index.css';
import theme from './theme';
import { WagmiProvider } from './providers/WagmiProvider';
import { QueryClientProvider } from './providers/QueryClientProvider';
import './assets/styles/main.scss';
import 'simplebar-react/dist/simplebar.min.css';
import { StakeProvider } from './contexts/stake';
import { KVStoreProvider } from './contexts/kvstore';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <WagmiProvider>
      <QueryClientProvider>
        <ThemeProvider theme={theme}>
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
