import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import '@/i18n/i18n';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter } from 'react-router-dom';
import { DisplayModal } from '@/components/ui/modal/display-modal';
import { AuthProvider } from '@/auth/auth-context';
import { Router } from '@/router/router';
import '@fontsource/inter';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/800.css';
import { WalletConnectProvider } from '@/contexts/wallet-connect';
import { Web3AuthProvider } from '@/auth-web3/web3-auth-context';
import { JWTExpirationCheck } from '@/contexts/jwt-expiration-check';
import { ColorModeProvider } from '@/contexts/color-mode-context';
import { HomePageStateProvider } from '@/contexts/homepage-state';

const root = document.getElementById('root');
if (!root) throw Error('root element is undefined');

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: { retry: 0 },
    queries: { retry: 0 },
  },
});

createRoot(root).render(
  <StrictMode>
    <ColorModeProvider>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <WalletConnectProvider>
            <HomePageStateProvider>
              <Web3AuthProvider>
                <AuthProvider>
                  <DisplayModal />
                  <JWTExpirationCheck>
                    <Router />
                  </JWTExpirationCheck>
                </AuthProvider>
              </Web3AuthProvider>
            </HomePageStateProvider>
            <ReactQueryDevtools client={queryClient} initialIsOpen={false} />
          </WalletConnectProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ColorModeProvider>
  </StrictMode>
);
