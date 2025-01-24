import { FC, PropsWithChildren } from 'react';
import { createConfig, http, WagmiProvider as WWagmiProvider } from 'wagmi';
import { walletConnect, coinbaseWallet } from 'wagmi/connectors';
import * as wagmiChains from 'wagmi/chains';
import { LOCALHOST, SUPPORTED_CHAIN_IDS } from '../constants/chains';

const projectId = import.meta.env.VITE_APP_WALLETCONNECT_PROJECT_ID;

const chainIdToChainMap: Record<number, any> = {
  [wagmiChains.mainnet.id]: wagmiChains.mainnet,
  [wagmiChains.sepolia.id]: wagmiChains.sepolia,
  [wagmiChains.bsc.id]: wagmiChains.bsc,
  [wagmiChains.bscTestnet.id]: wagmiChains.bscTestnet,
  [wagmiChains.polygon.id]: wagmiChains.polygon,
  [wagmiChains.polygonAmoy.id]: wagmiChains.polygonAmoy,
  [wagmiChains.moonbeam.id]: wagmiChains.moonbeam,
  [wagmiChains.moonbaseAlpha.id]: wagmiChains.moonbaseAlpha,
  [wagmiChains.avalanche.id]: wagmiChains.avalanche,
  [wagmiChains.avalancheFuji.id]: wagmiChains.avalancheFuji,
  [wagmiChains.xLayer.id]: wagmiChains.xLayer,
  [wagmiChains.xLayerTestnet.id]: wagmiChains.xLayerTestnet,
  [LOCALHOST.id]: LOCALHOST,
};

const supportedChains = SUPPORTED_CHAIN_IDS.map(
  (id) => chainIdToChainMap[id]
).filter(Boolean);

export const wagmiConfig = createConfig({
  chains: supportedChains as any,
  connectors: [
    walletConnect({
      showQrModal: true,
      projectId: projectId ?? '',
    }),
    coinbaseWallet({
      appName: 'human-staking-dashboard',
    }),
  ],
  transports: Object.fromEntries(
    supportedChains.map((chain) => [
      chain.id,
      http(chain.rpcUrls.default.http[0]),
    ])
  ),
});

export const WagmiProvider: FC<PropsWithChildren> = ({ children }) => {
  return <WWagmiProvider config={wagmiConfig}>{children}</WWagmiProvider>;
};
