import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import '@/shared/i18n/i18n';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter } from 'react-router-dom';
import { DisplayModal } from '@/shared/components/ui/modal/display-modal';
import { AuthProvider } from '@/modules/auth/context/auth-context';
import { Router } from '@/router/router';
import '@fontsource/inter';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/800.css';
import { WalletConnectProvider } from '@/shared/contexts/wallet-connect';
import { Web3AuthProvider } from '@/modules/auth-web3/context/web3-auth-context';
import { JWTExpirationCheck } from '@/shared/contexts/jwt-expiration-check';
import { ColorModeProvider } from '@/shared/contexts/color-mode-context';
import { HomePageStateProvider } from '@/shared/contexts/homepage-state';
import { RegisteredOraclesProvider } from '@/shared/contexts/registered-oracles';
import { NotificationProvider } from '@/shared/providers/notifications-provider';

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
        <NotificationProvider>
          <BrowserRouter>
            <WalletConnectProvider>
              <HomePageStateProvider>
                <Web3AuthProvider>
                  <AuthProvider>
                    <DisplayModal />
                    <JWTExpirationCheck>
                      <RegisteredOraclesProvider>
                        <Router />
                      </RegisteredOraclesProvider>
                    </JWTExpirationCheck>
                  </AuthProvider>
                </Web3AuthProvider>
              </HomePageStateProvider>
              <ReactQueryDevtools client={queryClient} initialIsOpen={false} />
            </WalletConnectProvider>
          </BrowserRouter>
        </NotificationProvider>
      </QueryClientProvider>
    </ColorModeProvider>
  </StrictMode>
);
