import { FC, PropsWithChildren } from 'react';
import { createConfig, WagmiProvider as WWagmiProvider } from 'wagmi';
import * as wagmiChains from 'wagmi/chains';
import { coinbaseWallet, walletConnect } from 'wagmi/connectors';

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
  ],
});

export const WagmiProvider: FC<PropsWithChildren> = ({ children }) => {
  return <WWagmiProvider config={wagmiConfig}>{children}</WWagmiProvider>;
};
