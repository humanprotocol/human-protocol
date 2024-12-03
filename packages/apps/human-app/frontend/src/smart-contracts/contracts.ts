// this file defines contract addresses
// from https://docs.humanprotocol.org/human-tech-docs/architecture/components/smart-contracts/contract-addresses

import { ChainId } from '@human-protocol/sdk/src/enums';
import { NETWORKS } from '@human-protocol/sdk/src/constants';

export interface ContractsAddresses {
  HMToken: string;
  Staking: string;
  EthKVStore: string;
}

export type Testnet = 'Amoy';
export type Mainnet = 'Polygon';

export const TestnetContracts: Record<Testnet, ContractsAddresses> = {
  Amoy: {
    Staking: NETWORKS[ChainId.POLYGON_AMOY]?.stakingAddress ?? '',
    HMToken: NETWORKS[ChainId.POLYGON_AMOY]?.hmtAddress ?? '',
    EthKVStore: NETWORKS[ChainId.POLYGON_AMOY]?.kvstoreAddress ?? '',
  },
};

export const MainnetContracts: Record<Mainnet, ContractsAddresses> = {
  Polygon: {
    Staking: NETWORKS[ChainId.POLYGON]?.stakingAddress ?? '',
    HMToken: NETWORKS[ChainId.POLYGON]?.hmtAddress ?? '',
    EthKVStore: NETWORKS[ChainId.POLYGON]?.kvstoreAddress ?? '',
  },
};
