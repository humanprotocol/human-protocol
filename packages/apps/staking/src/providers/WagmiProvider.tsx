import { FC, PropsWithChildren } from 'react';
import { createConfig, http, WagmiProvider as WWagmiProvider } from 'wagmi';
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
  transports: {
    [wagmiChains.mainnet.id]: http(),
    [wagmiChains.sepolia.id]: http(),
    [wagmiChains.bsc.id]: http(),
    [wagmiChains.bscTestnet.id]: http(),
    [wagmiChains.polygon.id]: http(),
    [wagmiChains.polygonAmoy.id]: http(),
    [wagmiChains.moonbeam.id]: http(),
    [wagmiChains.moonbaseAlpha.id]: http(),
    [wagmiChains.avalanche.id]: http(),
    [wagmiChains.avalancheFuji.id]: http(),
    [wagmiChains.xLayer.id]: http(),
    [wagmiChains.xLayerTestnet.id]: http(),
    [LOCALHOST.id]: http(LOCALHOST.rpcUrls.default.http[0]),
  },
});

export const WagmiProvider: FC<PropsWithChildren> = ({ children }) => {
  return <WWagmiProvider config={wagmiConfig}>{children}</WWagmiProvider>;
};
