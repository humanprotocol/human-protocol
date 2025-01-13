import React, { useEffect, useState } from 'react';
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
import { useWeb3Provider } from '@/shared/hooks/use-web3-provider';
import { JsonRpcError } from '@/modules/smart-contracts/json-rpc-error';
import { WalletConnectContext } from '../contexts/wallet-connect';

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

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
});

export function WalletConnectProvider({
  children,
}: {
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
    </WagmiProvider>
  );
}
