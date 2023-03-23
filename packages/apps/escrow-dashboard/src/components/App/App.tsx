import { ThemeProvider } from '@mui/material/styles';
import { FC } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiConfig, createClient, configureChains } from 'wagmi';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { publicProvider } from 'wagmi/providers/public';

import { Layout } from '../Layout';

import { ESCROW_NETWORKS, ChainId } from 'src/constants';
import { routes as appRoutes } from 'src/routes';
import theme from 'src/theme';

const projectId = import.meta.env.VITE_APP_WALLETCONNECT_PROJECT_ID;

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
        showQrModal: true,
        projectId: projectId || '',
      },
    }),
  ],
  provider,
  webSocketProvider,
});

export const App: FC = () => {
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
