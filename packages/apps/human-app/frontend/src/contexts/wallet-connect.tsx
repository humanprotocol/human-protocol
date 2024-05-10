import {
  createWeb3Modal,
  defaultConfig,
  useWeb3Modal,
  useWeb3ModalAccount,
} from '@web3modal/ethers/react';
import type { JsonRpcSigner, BrowserProvider, Eip1193Provider } from 'ethers';
import React, { createContext } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import { useWeb3Provider } from '@/hooks/use-web3-provider';
import { env } from '@/shared/env';
import type { ResponseError } from '@/shared/types/global.type';
import { chains } from '@/smart-contracts/chains';

const projectId = env.VITE_WALLET_CONNECT_PROJECT_ID;

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
  chains,
  projectId,
  enableAnalytics: true,
});
export interface CommonWalletConnectContext {
  openModal: () => Promise<void>;
  web3ProviderMutation: UseMutationResult<
    {
      provider: BrowserProvider;
      signer: JsonRpcSigner;
    },
    ResponseError,
    Eip1193Provider
  >;
}

interface ConnectedAccount {
  isConnected: true;
  chainId: number;
  address: `0x${string}`;
}

interface DisconnectedAccount {
  isConnected: false;
}

export type WalletConnectContextConnectedAccount = CommonWalletConnectContext &
  ConnectedAccount;

type WalletConnectContextDisconnectedAccount = CommonWalletConnectContext &
  DisconnectedAccount;

export const WalletConnectContext = createContext<
  | WalletConnectContextConnectedAccount
  | WalletConnectContextDisconnectedAccount
  | null
>(null);

export function WalletConnectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const web3ProviderMutation = useWeb3Provider();
  const { open } = useWeb3Modal();
  const { address, chainId, isConnected } = useWeb3ModalAccount();

  const openModal = async () => {
    await open();
  };

  return (
    <WalletConnectContext.Provider
      value={
        isConnected && address && chainId
          ? {
              isConnected: true,
              address,
              chainId,
              web3ProviderMutation,
              openModal,
            }
          : {
              isConnected: false,
              web3ProviderMutation,
              openModal,
            }
      }
    >
      {children}
    </WalletConnectContext.Provider>
  );
}
