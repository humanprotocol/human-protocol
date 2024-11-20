// this file defines contract addresses
// from https://docs.humanprotocol.org/human-tech-docs/architecture/components/smart-contracts/contract-addresses

import { ChainId } from '@human-protocol/sdk/src/enums';
import { NETWORKS } from '@human-protocol/sdk/src/constants';

export interface ContractsAddresses {
  HMToken: string;
  Staking: string;
  EthKVStore: string;
}

export type Testnet =
  | ChainId.POLYGON_AMOY
  | ChainId.SEPOLIA
  | ChainId.RINKEBY
  | ChainId.GOERLI
  | ChainId.BSC_TESTNET
  | ChainId.POLYGON_MUMBAI
  | ChainId.MOONBASE_ALPHA
  | ChainId.AVALANCHE_TESTNET
  | ChainId.CELO_ALFAJORES
  | ChainId.XLAYER_TESTNET
  | ChainId.ALL
  | ChainId.LOCALHOST;

export type Mainnet =
  | ChainId.POLYGON
  | ChainId.MAINNET
  | ChainId.BSC_MAINNET
  | ChainId.MOONBEAM
  | ChainId.AVALANCHE
  | ChainId.CELO
  | ChainId.XLAYER
  | ChainId.ALL
  | ChainId.LOCALHOST;

export type TestnetNarrow = Exclude<ChainId, Mainnet>;
export type MainnetNarrow = Exclude<ChainId, Testnet>;

export const TestnetContracts: Record<TestnetNarrow, ContractsAddresses> = {
  [ChainId.POLYGON_AMOY]: {
    Staking: NETWORKS[ChainId.POLYGON_AMOY]?.stakingAddress ?? '',
    HMToken: NETWORKS[ChainId.POLYGON_AMOY]?.hmtAddress ?? '',
    EthKVStore: NETWORKS[ChainId.POLYGON_AMOY]?.kvstoreAddress ?? '',
  },
  [ChainId.SEPOLIA]: {
    Staking: NETWORKS[ChainId.SEPOLIA]?.stakingAddress ?? '',
    HMToken: NETWORKS[ChainId.SEPOLIA]?.hmtAddress ?? '',
    EthKVStore: NETWORKS[ChainId.SEPOLIA]?.kvstoreAddress ?? '',
  },
  [ChainId.RINKEBY]: {
    Staking: NETWORKS[ChainId.RINKEBY]?.stakingAddress ?? '',
    HMToken: NETWORKS[ChainId.RINKEBY]?.hmtAddress ?? '',
    EthKVStore: NETWORKS[ChainId.RINKEBY]?.kvstoreAddress ?? '',
  },
  [ChainId.GOERLI]: {
    Staking: NETWORKS[ChainId.GOERLI]?.stakingAddress ?? '',
    HMToken: NETWORKS[ChainId.GOERLI]?.hmtAddress ?? '',
    EthKVStore: NETWORKS[ChainId.GOERLI]?.kvstoreAddress ?? '',
  },
  [ChainId.BSC_TESTNET]: {
    Staking: NETWORKS[ChainId.BSC_TESTNET]?.stakingAddress ?? '',
    HMToken: NETWORKS[ChainId.BSC_TESTNET]?.hmtAddress ?? '',
    EthKVStore: NETWORKS[ChainId.BSC_TESTNET]?.kvstoreAddress ?? '',
  },
  [ChainId.POLYGON_MUMBAI]: {
    Staking: NETWORKS[ChainId.POLYGON_MUMBAI]?.stakingAddress ?? '',
    HMToken: NETWORKS[ChainId.POLYGON_MUMBAI]?.hmtAddress ?? '',
    EthKVStore: NETWORKS[ChainId.POLYGON_MUMBAI]?.kvstoreAddress ?? '',
  },
  [ChainId.MOONBASE_ALPHA]: {
    Staking: NETWORKS[ChainId.MOONBASE_ALPHA]?.stakingAddress ?? '',
    HMToken: NETWORKS[ChainId.MOONBASE_ALPHA]?.hmtAddress ?? '',
    EthKVStore: NETWORKS[ChainId.MOONBASE_ALPHA]?.kvstoreAddress ?? '',
  },
  [ChainId.AVALANCHE_TESTNET]: {
    Staking: NETWORKS[ChainId.AVALANCHE_TESTNET]?.stakingAddress ?? '',
    HMToken: NETWORKS[ChainId.AVALANCHE_TESTNET]?.hmtAddress ?? '',
    EthKVStore: NETWORKS[ChainId.AVALANCHE_TESTNET]?.kvstoreAddress ?? '',
  },
  [ChainId.CELO_ALFAJORES]: {
    Staking: NETWORKS[ChainId.CELO_ALFAJORES]?.stakingAddress ?? '',
    HMToken: NETWORKS[ChainId.CELO_ALFAJORES]?.hmtAddress ?? '',
    EthKVStore: NETWORKS[ChainId.CELO_ALFAJORES]?.kvstoreAddress ?? '',
  },
  [ChainId.XLAYER_TESTNET]: {
    Staking: NETWORKS[ChainId.XLAYER_TESTNET]?.stakingAddress ?? '',
    HMToken: NETWORKS[ChainId.XLAYER_TESTNET]?.hmtAddress ?? '',
    EthKVStore: NETWORKS[ChainId.XLAYER_TESTNET]?.kvstoreAddress ?? '',
  },
};

export const MainnetContracts: Record<MainnetNarrow, ContractsAddresses> = {
  [ChainId.POLYGON]: {
    Staking: NETWORKS[ChainId.POLYGON]?.stakingAddress ?? '',
    HMToken: NETWORKS[ChainId.POLYGON]?.hmtAddress ?? '',
    EthKVStore: NETWORKS[ChainId.POLYGON]?.kvstoreAddress ?? '',
  },
  [ChainId.MAINNET]: {
    Staking: NETWORKS[ChainId.MAINNET]?.stakingAddress ?? '',
    HMToken: NETWORKS[ChainId.MAINNET]?.hmtAddress ?? '',
    EthKVStore: NETWORKS[ChainId.MAINNET]?.kvstoreAddress ?? '',
  },
  [ChainId.BSC_MAINNET]: {
    Staking: NETWORKS[ChainId.BSC_MAINNET]?.stakingAddress ?? '',
    HMToken: NETWORKS[ChainId.BSC_MAINNET]?.hmtAddress ?? '',
    EthKVStore: NETWORKS[ChainId.BSC_MAINNET]?.kvstoreAddress ?? '',
  },
  [ChainId.MOONBEAM]: {
    Staking: NETWORKS[ChainId.MOONBEAM]?.stakingAddress ?? '',
    HMToken: NETWORKS[ChainId.MOONBEAM]?.hmtAddress ?? '',
    EthKVStore: NETWORKS[ChainId.MOONBEAM]?.kvstoreAddress ?? '',
  },
  [ChainId.AVALANCHE]: {
    Staking: NETWORKS[ChainId.AVALANCHE]?.stakingAddress ?? '',
    HMToken: NETWORKS[ChainId.AVALANCHE]?.hmtAddress ?? '',
    EthKVStore: NETWORKS[ChainId.AVALANCHE]?.kvstoreAddress ?? '',
  },
  [ChainId.CELO]: {
    Staking: NETWORKS[ChainId.CELO]?.stakingAddress ?? '',
    HMToken: NETWORKS[ChainId.CELO]?.hmtAddress ?? '',
    EthKVStore: NETWORKS[ChainId.CELO]?.kvstoreAddress ?? '',
  },
  [ChainId.XLAYER]: {
    Staking: NETWORKS[ChainId.XLAYER]?.stakingAddress ?? '',
    HMToken: NETWORKS[ChainId.XLAYER]?.hmtAddress ?? '',
    EthKVStore: NETWORKS[ChainId.XLAYER]?.kvstoreAddress ?? '',
  },
};
