import { Buffer } from 'buffer';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
import React from 'react';
import { createRoot } from 'react-dom/client';
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
import reportWebVitals from './reportWebVitals';
import theme from './theme';

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
  [publicProvider()]
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
const baseUrl = import.meta.env.VITE_APP_JOB_LAUNCHER_SERVER_URL;
axios.get(`${baseUrl}/config`).then((r) =>
  loadStripe(r.data.publishableKey).then((stripePromise) =>
    root.render(
      <React.StrictMode>
        <WagmiConfig client={client}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Elements stripe={stripePromise}>
              <App />
            </Elements>
          </ThemeProvider>
        </WagmiConfig>
      </React.StrictMode>
    )
  )
);

const root = createRoot(document.getElementById('root') as HTMLElement);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
