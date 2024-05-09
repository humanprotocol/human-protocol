import { ThemeProvider } from '@mui/material/styles';
import { FC } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiConfig, createClient, configureChains, Chain } from 'wagmi';
import * as wagmiChains from 'wagmi/chains';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { publicProvider } from 'wagmi/providers/public';
import { Layout } from '../Layout';
import { RPC_URLS } from 'src/constants';
import { routes as appRoutes } from 'src/routes';
import theme from 'src/theme';

const projectId = import.meta.env.VITE_APP_WALLETCONNECT_PROJECT_ID;

export const xLayer = {
  id: 196,
  name: 'xLayer',
  network: 'xLayer',
  nativeCurrency: {
    decimals: 18,
    name: 'OKB',
    symbol: 'OKB',
  },
  rpcUrls: {
    public: { http: ['https://xlayerrpc.okx.com'] },
    default: { http: ['https://xlayerrpc.okx.com'] },
  },
  blockExplorers: {
    etherscan: { name: 'SnowTrace', url: 'https://www.oklink.com/xlayer' },
    default: { name: 'SnowTrace', url: 'https://www.oklink.com/xlayer' },
  },
} as const satisfies Chain;

const defaultChains = [
  wagmiChains.mainnet,
  wagmiChains.goerli,
  wagmiChains.bsc,
  wagmiChains.bscTestnet,
  wagmiChains.polygon,
  wagmiChains.polygonMumbai,
  wagmiChains.moonbeam,
  wagmiChains.moonbaseAlpha,
  wagmiChains.avalancheFuji,
  wagmiChains.avalanche,
  wagmiChains.skaleHumanProtocol,
  wagmiChains.okc,
  xLayer,
];

const rpcProviders = Object.values(RPC_URLS).map((rpcUrl) =>
  jsonRpcProvider({ rpc: (chain) => ({ http: rpcUrl }) })
);

const { chains, provider, webSocketProvider } = configureChains(defaultChains, [
  publicProvider(),
  ...rpcProviders,
]);

const client = createClient({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'human-dashboard-ui',
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
