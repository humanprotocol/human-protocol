import { ChainId } from '@human-protocol/sdk';

import { FC, PropsWithChildren } from 'react';
import { http, createConfig, WagmiProvider as WWagmiProvider } from 'wagmi';
import * as wagmiChains from 'wagmi/chains';
import { coinbaseWallet, walletConnect } from 'wagmi/connectors';

import { RPC_URLS, LOCALHOST } from '../constants/chains';

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
    wagmiChains.skaleHumanProtocol,
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
    [wagmiChains.mainnet.id]: http(RPC_URLS[ChainId.MAINNET]),
    [wagmiChains.sepolia.id]: http(RPC_URLS[ChainId.SEPOLIA]),
    [wagmiChains.bsc.id]: http(RPC_URLS[ChainId.BSC_MAINNET]),
    [wagmiChains.bscTestnet.id]: http(RPC_URLS[ChainId.BSC_TESTNET]),
    [wagmiChains.polygon.id]: http(RPC_URLS[ChainId.POLYGON]),
    [wagmiChains.polygonAmoy.id]: http(RPC_URLS[ChainId.POLYGON_AMOY]),
    [wagmiChains.moonbeam.id]: http(RPC_URLS[ChainId.MOONBEAM]),
    [wagmiChains.moonbaseAlpha.id]: http(RPC_URLS[ChainId.MOONBASE_ALPHA]),
    [wagmiChains.avalanche.id]: http(RPC_URLS[ChainId.AVALANCHE]),
    [wagmiChains.avalancheFuji.id]: http(RPC_URLS[ChainId.AVALANCHE_TESTNET]),
    [wagmiChains.skaleHumanProtocol.id]: http(RPC_URLS[ChainId.SKALE]),
    [LOCALHOST.id]: http(RPC_URLS[ChainId.LOCALHOST]),
  },
});

export const WagmiProvider: FC<PropsWithChildren> = ({ children }) => {
  return <WWagmiProvider config={wagmiConfig}>{children}</WWagmiProvider>;
};