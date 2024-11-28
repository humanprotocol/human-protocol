// This file defines chains that will be available in wallet-connect modal
// according to docs: https://docs.walletconnect.com/web3modal/react/about.
// For particular chains we define set of smart contract addresses.
// Thanks to that we can get addresses for selected chain with getContractAddress
// function
import { ChainId } from '@human-protocol/sdk/src/enums';
import { NETWORKS } from '@human-protocol/sdk/src/constants';
import { env } from '@/shared/env';
import {
  MainnetContracts,
  TestnetContracts,
  type ContractsAddresses,
} from '@/smart-contracts/contracts';

export interface Chain {
  explorerUrl: string;
  name: string;
  chainId: number;
  rpcUrl?: string;
}

export type ChainWithAddresses = Chain & {
  addresses: ContractsAddresses;
};

export const TestnetChainsIds = [
  ChainId.POLYGON_AMOY,
  ChainId.SEPOLIA,
  ChainId.RINKEBY,
  ChainId.GOERLI,
  ChainId.BSC_TESTNET,
  ChainId.POLYGON_MUMBAI,
  ChainId.MOONBASE_ALPHA,
  ChainId.AVALANCHE_TESTNET,
  ChainId.CELO_ALFAJORES,
  ChainId.XLAYER_TESTNET,
  ChainId.LOCALHOST,
] as const;

export const MainnetChainsIds = [
  ChainId.POLYGON,
  ChainId.MAINNET,
  ChainId.BSC_MAINNET,
  ChainId.MOONBEAM,
  ChainId.AVALANCHE,
  ChainId.CELO,
  ChainId.XLAYER,
  ChainId.ALL,
] as const;

export type TestnetNarrow = Exclude<ChainId, (typeof MainnetChainsIds)[number]>;
export type MainnetNarrow = Exclude<ChainId, (typeof TestnetChainsIds)[number]>;

export const TestnetChains: ChainWithAddresses[] = [
  {
    chainId: 80002,
    name: 'Amoy',
    explorerUrl: 'https://amoy.polygonscan.com/',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    addresses: TestnetContracts.Amoy,
  },
];

export const MainnetChains: ChainWithAddresses[] = [
  {
    chainId: 137,
    name: 'Polygon',
    explorerUrl: 'https://polygonscan.com/',
    rpcUrl: 'https://polygon-rpc.com/',
    addresses: MainnetContracts.Polygon,
  },
];

export const AllTestnetsChains: ChainWithAddresses[] =
  getChainConfigsForChainIds<TestnetNarrow>([...TestnetChainsIds]);

export const AllMainnetChains: ChainWithAddresses[] =
  getChainConfigsForChainIds<MainnetNarrow>([...MainnetChainsIds]);

function getChainConfigsForChainIds<T extends TestnetNarrow | MainnetNarrow>(
  chainsArr: T[]
): ChainWithAddresses[] {
  const result: ChainWithAddresses[] = [];

  for (const currentValue of chainsArr) {
    if (currentValue in NETWORKS) {
      result.push({
        chainId: currentValue,
        name: NETWORKS[currentValue]?.title ?? '',
        explorerUrl: NETWORKS[currentValue]?.scanUrl ?? '',
        addresses: {
          Staking: NETWORKS[currentValue]?.stakingAddress ?? '',
          HMToken: NETWORKS[currentValue]?.hmtAddress ?? '',
          EthKVStore: NETWORKS[currentValue]?.kvstoreAddress ?? '',
        },
      });
    }
  }
  return result;
}

const handleFilterChains = (
  chainsArr: ChainWithAddresses[],
  chainIdsEnabled: number[]
) => {
  return chainsArr.filter((chain) =>
    chainIdsEnabled.some((el) => el === chain.chainId)
  );
};

export const getTestnetChainsEnabled = (chainIdsEnabled: number[]) => {
  return handleFilterChains(AllTestnetsChains, chainIdsEnabled);
};

export const getMainnetChainsEnabled = (chainIdsEnabled: number[]) => {
  return handleFilterChains(AllMainnetChains, chainIdsEnabled);
};

// chains for getContractAddress function
export const chainsWithSCAddresses: ChainWithAddresses[] =
  env.VITE_NETWORK === 'mainnet' ? MainnetChains : TestnetChains;

export const getEnabledChainsByUiConfig = (
  chainIdsEnabled: number[]
): Chain[] =>
  (env.VITE_NETWORK === 'mainnet'
    ? getMainnetChainsEnabled(chainIdsEnabled)
    : getTestnetChainsEnabled(chainIdsEnabled)
  ).map(({ addresses: _, ...chainData }) => chainData);
