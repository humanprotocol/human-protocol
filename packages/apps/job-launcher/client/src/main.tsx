// import { Buffer } from 'buffer';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import App from './App';
import { LOCAL_STORAGE_KEYS } from './constants';
import {
  QueryClientProvider,
  SnackbarProvider,
  WagmiProvider,
} from './providers';
import reportWebVitals from './reportWebVitals';
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
    <React.StrictMode>
      <Provider store={store}>
        <WagmiProvider>
          <QueryClientProvider>
            <ThemeProvider theme={theme}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <CssBaseline />
                <Elements stripe={stripePromise}>
                  <SnackbarProvider>
                    <App />
                  </SnackbarProvider>
                </Elements>
              </LocalizationProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </Provider>
    </React.StrictMode>,
  );
});

const root = createRoot(document.getElementById('root') as HTMLElement);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
