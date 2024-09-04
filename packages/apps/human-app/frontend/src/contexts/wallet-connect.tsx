import {
  createWeb3Modal,
  defaultConfig,
  useWeb3Modal,
  useWeb3ModalAccount,
} from '@web3modal/ethers/react';
import type { JsonRpcSigner, BrowserProvider, Eip1193Provider } from 'ethers';
import React, { createContext, useEffect, useState } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import { useWeb3Provider } from '@/hooks/use-web3-provider';
import { env } from '@/shared/env';
import type { ResponseError } from '@/shared/types/global.type';
import { chains } from '@/smart-contracts/chains';
import { JsonRpcError } from '@/smart-contracts/json-rpc-error';

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
  initializing: boolean;
}

interface ConnectedAccount {
  isConnected: true;
  chainId: number;
  address: `0x${string}`;
  signMessage: (message: string) => Promise<string | undefined>;
}

interface DisconnectedAccount {
  isConnected: false;
  chainId?: never;
  address?: never;
  signMessage?: (message: string) => Promise<string | undefined>;
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
  const [initializing, setInitializing] = useState(true);
  const web3ProviderMutation = useWeb3Provider();
  const { open } = useWeb3Modal();
  const { address, chainId, isConnected } = useWeb3ModalAccount();

  const openModal = async () => {
    await open();
  };

  useEffect(() => {
    if (
      web3ProviderMutation.status === 'error' ||
      web3ProviderMutation.status === 'success'
    ) {
      setInitializing(false);
    }
  }, [web3ProviderMutation]);

  return (
    <WalletConnectContext.Provider
      value={
        isConnected && address && chainId && web3ProviderMutation.data
          ? {
              isConnected: true,
              address,
              chainId,
              web3ProviderMutation,
              openModal,
              signMessage: async (message: string) => {
                try {
                  const signature =
                    await web3ProviderMutation.data.signer.signMessage(message);
                  return signature;
                } catch (error) {
                  throw new JsonRpcError(error);
                }
              },
              initializing,
            }
          : {
              isConnected: false,
              web3ProviderMutation,
              openModal,
              signMessage: async (message: string) => {
                if (web3ProviderMutation.data) {
                  try {
                    const signature =
                      await web3ProviderMutation.data.signer.signMessage(
                        message
                      );
                    return signature;
                  } catch (error) {
                    throw new JsonRpcError(error);
                  }
                }
                return Promise.resolve(undefined);
              },
              initializing,
            }
      }
    >
      {children}
    </WalletConnectContext.Provider>
  );
}
