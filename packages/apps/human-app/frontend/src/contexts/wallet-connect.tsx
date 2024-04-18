import {
  createWeb3Modal,
  defaultConfig,
  useWeb3Modal,
  useWeb3ModalAccount,
} from '@web3modal/ethers/react';
import type { JsonRpcSigner, BrowserProvider } from 'ethers';
import React, { createContext } from 'react';
import { useWalletConnection } from '@/hooks/use-web3-provider';
import { env } from '@/shared/env';

const projectId = env.VITE_WALLET_CONNECT_PROJECT_ID;

const mainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'https://cloudflare-eth.com',
};

const metadata = {
  name: env.VITE_DAPP_META_NAME,
  description: env.VITE_DAPP_META_DESCRIPTION,
  url: env.VITE_DAPP_META_URL,
  icons: env.VITE_DAPP_ICONS,
};

const ethersConfig = defaultConfig({
  metadata,
});

createWeb3Modal({
  ethersConfig,
  chains: [mainnet],
  projectId,
  enableAnalytics: true,
});

export interface WalletConnectContext {
  openModal: () => Promise<void>;
  isConnected: boolean;
  chainId?: number;
  address?: `0x${string}`;
  provider?: BrowserProvider;
  signer?: JsonRpcSigner;
}

export const WalletConnectContext = createContext<WalletConnectContext | null>(
  null
);

export function WalletConnectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { provider, signer } = useWalletConnection();
  const { open } = useWeb3Modal();
  const { address, chainId, isConnected } = useWeb3ModalAccount();

  return (
    <WalletConnectContext.Provider
      value={{
        openModal: async () => {
          await open();
        },
        isConnected,
        chainId,
        address,
        provider,
        signer,
      }}
    >
      {children}
    </WalletConnectContext.Provider>
  );
}
