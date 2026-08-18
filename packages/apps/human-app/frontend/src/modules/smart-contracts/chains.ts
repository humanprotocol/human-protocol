// This file defines chains that will be available in wallet-connect modal
// according to docs: https://docs.walletconnect.com/web3modal/react/about.
// For particular chains we define set of smart contract addresses.
// Thanks to that we can get addresses for selected chain with getContractAddress
// function
import { ChainId } from '@human-protocol/sdk/src/enums';
import { NETWORKS } from '@human-protocol/sdk/src/constants';
import {
  MainnetContracts,
  TestnetContracts,
  type ContractsAddresses,
} from '@/modules/smart-contracts/contracts';

interface Chain {
  explorerUrl: string;
  name: string;
  chainId: number;
  rpcUrl?: string;
}

export type ChainWithAddresses = Chain & {
  addresses: ContractsAddresses;
};

const TestnetChainsIds = [
  ChainId.POLYGON_AMOY,
  ChainId.SEPOLIA,
  ChainId.BSC_TESTNET,
  ChainId.LOCALHOST,
] as const;

const MainnetChainsIds = [
  ChainId.POLYGON,
  ChainId.MAINNET,
  ChainId.BSC_MAINNET,
  ChainId.ALL,
] as const;

type TestnetNarrow = Exclude<ChainId, (typeof MainnetChainsIds)[number]>;
type MainnetNarrow = Exclude<ChainId, (typeof TestnetChainsIds)[number]>;

export const TestnetChains: readonly ChainWithAddresses[] = [
  {
    chainId: 80002,
    name: 'Amoy',
    explorerUrl: 'https://amoy.polygonscan.com/',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    addresses: TestnetContracts.Amoy,
  },
];

export const MainnetChains: readonly ChainWithAddresses[] = [
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
