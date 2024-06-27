// this file defines contract addresses
// from https://docs.humanprotocol.org/human-tech-docs/architecture/components/smart-contracts/contract-addresses

import { env } from '@/shared/env';

export interface ContractsAddresses {
  HMToken: string;
  Staking: string;
  EthKVStore: string;
}

export type Testnet = 'Amoy';
export type Mainnet = 'Polygon';

export const TestnetContracts: Record<Testnet, ContractsAddresses> = {
  Amoy: {
    Staking: env.VITE_TESTNET_AMOY_STAKING_CONTRACT,
    HMToken: env.VITE_TESTNET_AMOY_HMTOKEN_CONTRACT,
    EthKVStore: env.VITE_TESTNET_AMOY_ETH_KV_STORE_CONTRACT,
  },
};

export const MainnetContracts: Record<Mainnet, ContractsAddresses> = {
  Polygon: {
    Staking: env.VITE_MAINNET_POLYGON_STAKING_CONTRACT,
    HMToken: env.VITE_MAINNET_POLYGON_HMTOKEN_CONTRACT,
    EthKVStore: env.VITE_MAINNET_POLYGON_ETH_KV_STORE_CONTRACT,
  },
};
