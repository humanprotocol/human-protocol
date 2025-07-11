// import { Buffer } from 'buffer';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import App from './App';
import { LOCAL_STORAGE_KEYS } from './constants';
import {
  QueryClientProvider,
  SnackbarProvider,
  WagmiProvider,
} from './providers';
import { store } from './state';
import { fetchUserBalanceAsync, signIn } from './state/auth/reducer';
import theme from './theme';

// import { isJwtExpired } from './utils/jwt';

window.Buffer = window.Buffer || Buffer;

const publishableKey = import.meta.env.VITE_APP_STRIPE_PUBLISHABLE_KEY ?? '';
loadStripe(publishableKey).then((stripePromise) => {
  const accessToken = localStorage.getItem(LOCAL_STORAGE_KEYS.accessToken);
  const refreshToken = localStorage.getItem(LOCAL_STORAGE_KEYS.refreshToken);

  if (accessToken && refreshToken) {
    store.dispatch(
      signIn({
        accessToken,
        refreshToken,
      }),
    );
    store.dispatch(fetchUserBalanceAsync());
  }

  root.render(
    <StrictMode>
      <Provider store={store}>
        <WagmiProvider>
          <QueryClientProvider>
            <ThemeProvider theme={theme}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <CssBaseline />
                <Elements
                  stripe={stripePromise}
                  options={{ mode: 'setup', currency: 'usd' }}
                >
                  <SnackbarProvider>
                    <App />
                  </SnackbarProvider>
                </Elements>
              </LocalizationProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </Provider>
    </StrictMode>,
  );
});

const root = createRoot(document.getElementById('root') as HTMLElement);
