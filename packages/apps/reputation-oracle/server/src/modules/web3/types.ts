import { ChainId } from '@human-protocol/sdk';

import type { Provider, Wallet } from 'ethers';

export type Chain = {
  id: ChainId;
  rpcUrl: string;
};

export type WalletWithProvider = Wallet & { provider: Provider };
