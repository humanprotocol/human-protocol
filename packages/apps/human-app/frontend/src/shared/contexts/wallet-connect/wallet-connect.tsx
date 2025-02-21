import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
import {
  type WalletConnectContextConnectedAccount,
  type WalletConnectContextDisconnectedAccount,
} from './types';

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

export const WalletConnectContext = createContext<
  | WalletConnectContextConnectedAccount
  | WalletConnectContextDisconnectedAccount
  | null
>(null);

export function WalletConnectProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [initializing, setInitializing] = useState(true);
  const web3ProviderMutation = useWeb3Provider();
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();

  useEffect(() => {
    if (
      web3ProviderMutation.status === 'error' ||
      web3ProviderMutation.status === 'success'
    ) {
      setInitializing(false);
    }
  }, [web3ProviderMutation]);

  const openModal = useCallback(async () => {
    await open();
  }, [open]);

  const signMessage = useCallback(
    async (message: string) => {
      if (web3ProviderMutation.data) {
        try {
          const signature =
            await web3ProviderMutation.data.signer.signMessage(message);
          return signature;
        } catch (error) {
          throw new JsonRpcError(error);
        }
      }
    },
    [web3ProviderMutation.data]
  );

  const isReady = isConnected && address && chainId;

  const contextValue = useMemo(() => {
    return isReady
      ? ({
          isConnected: true,
          address,
          chainId: Number(chainId),
          web3ProviderMutation,
          openModal,
          signMessage,
          initializing,
        } satisfies WalletConnectContextConnectedAccount)
      : ({
          isConnected: false,
          web3ProviderMutation,
          openModal,
          signMessage,
          initializing,
        } satisfies WalletConnectContextDisconnectedAccount);
  }, [
    isReady,
    address,
    chainId,
    web3ProviderMutation,
    openModal,
    signMessage,
    initializing,
  ]);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <WalletConnectContext.Provider value={contextValue}>
        {children}
      </WalletConnectContext.Provider>
    </WagmiProvider>
  );
}
