import type { JsonRpcSigner, BrowserProvider, Eip1193Provider } from 'ethers';
import { type UseMutationResult } from '@tanstack/react-query';
import type { ResponseError } from '@/shared/types/global.type';

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
