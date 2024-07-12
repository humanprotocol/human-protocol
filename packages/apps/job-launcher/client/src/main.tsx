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
import { WagmiConfig, createClient, configureChains, Chain } from 'wagmi';
import {
  goerli,
  mainnet,
  polygon,
  polygonMumbai,
  bsc,
  bscTestnet,
  skaleHumanProtocol,
  moonbeam,
  moonbaseAlpha,
} from 'wagmi/chains';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { publicProvider } from 'wagmi/providers/public';

import App from './App';
import { LOCAL_STORAGE_KEYS } from './constants';
import SnackbarProvider from './providers/SnackProvider';
import reportWebVitals from './reportWebVitals';
import { store } from './state';
import { fetchUserBalanceAsync, signIn } from './state/auth/reducer';
import theme from './theme';
// import { isJwtExpired } from './utils/jwt';

window.Buffer = window.Buffer || Buffer;

const fortune: Chain = {
  id: 1338,
  name: 'Localhost',
  network: 'localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
};

// Configure chains & providers with the Alchemy provider.
// Two popular providers are Alchemy (alchemy.com) and Infura (infura.io)
const { chains, provider, webSocketProvider } = configureChains(
  [
    goerli,
    mainnet,
    polygon,
    skaleHumanProtocol,
    polygonMumbai,
    bsc,
    bscTestnet,
    fortune,
    moonbeam,
    moonbaseAlpha,
  ],
  [publicProvider()],
);

const projectId = import.meta.env.VITE_APP_WALLETCONNECT_PROJECT_ID;

// Set up client
const client = createClient({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'wagmi',
      },
    }),
    new WalletConnectConnector({
      chains,
      options: {
        showQrModal: true,
        projectId: projectId || '',
      },
    }),
  ],
  provider,
  webSocketProvider,
});

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
      <WagmiConfig client={client}>
        <Provider store={store}>
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
        </Provider>
      </WagmiConfig>
    </React.StrictMode>,
  );
});

const root = createRoot(document.getElementById('root') as HTMLElement);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
