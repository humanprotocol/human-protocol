import type { BrowserProvider, JsonRpcSigner } from 'ethers';

export interface ContractCallArguments {
  contractAddress: string;
  chainId: number;
  provider?: BrowserProvider;
  signer?: JsonRpcSigner;
}
