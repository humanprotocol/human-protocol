import { FC, PropsWithChildren } from 'react';
import {
  createConfig,
  WagmiProvider as WWagmiProvider,
  fallback,
  http,
  unstable_connector,
} from 'wagmi';
import * as wagmiChains from 'wagmi/chains';
import { coinbaseWallet, walletConnect, metaMask } from 'wagmi/connectors';

import { LOCALHOST } from '../constants/chains';

const projectId = import.meta.env.VITE_APP_WALLETCONNECT_PROJECT_ID;

export const wagmiConfig = createConfig({
  chains: [
    wagmiChains.mainnet,
    wagmiChains.sepolia,
    wagmiChains.bsc,
    wagmiChains.bscTestnet,
    wagmiChains.polygon,
    wagmiChains.polygonAmoy,
    wagmiChains.moonbeam,
    wagmiChains.moonbaseAlpha,
    wagmiChains.avalancheFuji,
    wagmiChains.avalanche,
    wagmiChains.xLayer,
    wagmiChains.xLayerTestnet,
    wagmiChains.auroraTestnet,
    LOCALHOST,
  ],
  connectors: [
    walletConnect({
      showQrModal: true,
      projectId: projectId ?? '',
    }),
    coinbaseWallet({
      appName: 'human-job-launcher',
    }),
    metaMask(),
  ],
  transports: {
    [wagmiChains.mainnet.id]: fallback([unstable_connector(metaMask), http()]),
    [wagmiChains.sepolia.id]: fallback([unstable_connector(metaMask), http()]),
    [wagmiChains.bsc.id]: fallback([unstable_connector(metaMask), http()]),
    [wagmiChains.bscTestnet.id]: fallback([
      unstable_connector(metaMask),
      http(),
    ]),
    [wagmiChains.polygon.id]: fallback([unstable_connector(metaMask), http()]),
    [wagmiChains.polygonAmoy.id]: fallback([
      unstable_connector(metaMask),
      http(),
    ]),
    [wagmiChains.moonbeam.id]: fallback([unstable_connector(metaMask), http()]),
    [wagmiChains.moonbaseAlpha.id]: fallback([
      unstable_connector(metaMask),
      http(),
    ]),
    [wagmiChains.avalanche.id]: fallback([
      unstable_connector(metaMask),
      http(),
    ]),
    [wagmiChains.avalancheFuji.id]: fallback([
      unstable_connector(metaMask),
      http(),
    ]),
    [wagmiChains.xLayer.id]: fallback([unstable_connector(metaMask), http()]),
    [wagmiChains.xLayerTestnet.id]: fallback([
      unstable_connector(metaMask),
      http(),
    ]),
    [wagmiChains.auroraTestnet.id]: fallback([
      unstable_connector(metaMask),
      http(),
    ]),
    [LOCALHOST.id]: fallback([
      unstable_connector(metaMask),
      http(LOCALHOST.rpcUrls.default.http[0]),
    ]),
  },
});

export const WagmiProvider: FC<PropsWithChildren> = ({ children }) => {
  return <WWagmiProvider config={wagmiConfig}>{children}</WWagmiProvider>;
};
