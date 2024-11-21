import type { JsonRpcSigner, BrowserProvider, Eip1193Provider } from 'ethers';
import React, { createContext, useEffect, useState } from 'react';
import {
  type UseMutationResult,
  type QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import {
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
  createAppKit,
  type AppKitOptions,
} from '@reown/appkit/react';
import { WagmiProvider } from 'wagmi';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { polygonAmoy, polygon } from '@reown/appkit/networks';
import { env } from '@/shared/env';
import type { ResponseError } from '@/shared/types/global.type';
import { useWeb3Provider } from '@/hooks/use-web3-provider';
import { JsonRpcError } from '@/smart-contracts/json-rpc-error';

const projectId = env.VITE_WALLET_CONNECT_PROJECT_ID;

const metadata = {
  name: env.VITE_DAPP_META_NAME,
  description: env.VITE_DAPP_META_DESCRIPTION,
  url: env.VITE_DAPP_META_URL,
  icons: env.VITE_DAPP_ICONS,
};

const networks: AppKitOptions['networks'] = [polygon, polygonAmoy];

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
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
  address: string;
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

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
});

export function WalletConnectProvider({
  client,
  children,
}: {
  client: QueryClient;
  children: React.ReactNode;
}) {
  const [initializing, setInitializing] = useState(true);
  const web3ProviderMutation = useWeb3Provider();
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();

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
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={client}>
        <WalletConnectContext.Provider
          value={
            isConnected && address && chainId && web3ProviderMutation.data
              ? {
                  isConnected: true,
                  address,
                  chainId: Number(chainId),
                  web3ProviderMutation,
                  openModal,
                  signMessage: async (message: string) => {
                    try {
                      const signature =
                        await web3ProviderMutation.data.signer.signMessage(
                          message
                        );
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
      </QueryClientProvider>
    </WagmiProvider>
  );
}
