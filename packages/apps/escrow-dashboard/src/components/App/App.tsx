import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { routes as appRoutes } from 'src/routes';
import theme from 'src/theme';
import Layout from 'src/components/Layout';
import { WagmiConfig, createClient, configureChains } from 'wagmi';

import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';

import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';

import { ESCROW_NETWORKS, ChainId } from '../../constants';

const chain = Object.values(ESCROW_NETWORKS)
  .filter(({ chainId }) => chainId !== ChainId.RINKEBY)
  .map(({ wagmiChain }) => wagmiChain);
const rpcUrls = Object.values(ESCROW_NETWORKS)
  .filter(({ chainId }) => chainId !== ChainId.RINKEBY)
  .map(({ rpcUrl }) =>
    jsonRpcProvider({
      rpc: (chain) => ({
        http: rpcUrl,
      }),
    })
  );

const { chains, provider, webSocketProvider } = configureChains(chain, [
  publicProvider(),
  ...rpcUrls,
]);

const client = createClient({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'escrow-dashboard',
      },
    }),
    new WalletConnectConnector({
      chains,
      options: {
        qrcode: true,
      },
    }),
  ],
  provider,
  webSocketProvider,
});

export const App: React.FC = (): React.ReactElement => {
  return (
    <WagmiConfig client={client}>
      <ThemeProvider theme={theme}>
        <Router>
          <Layout>
            <Routes>
              {appRoutes.map((route) => (
                <Route
                  key={route.key}
                  path={route.path}
                  element={<route.component />}
                />
              ))}
            </Routes>
          </Layout>
        </Router>
      </ThemeProvider>
    </WagmiConfig>
  );
};
