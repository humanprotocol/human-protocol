import type { JsonRpcSigner, BrowserProvider, Eip1193Provider } from 'ethers';
import { type UseMutationResult } from '@tanstack/react-query';
import type { ResponseError } from '@/shared/types/global.type';

interface CommonWalletConnectContext {
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
  signMessage: (message: string) => Promise<string | undefined>;
}

interface ConnectedAccount {
  isConnected: true;
  chainId: number;
  address: string;
}

interface DisconnectedAccount {
  isConnected: false;
  chainId?: never;
  address?: never;
}

export type WalletConnectContextConnectedAccount = CommonWalletConnectContext &
  ConnectedAccount;

export type WalletConnectContextDisconnectedAccount =
  CommonWalletConnectContext & DisconnectedAccount;
