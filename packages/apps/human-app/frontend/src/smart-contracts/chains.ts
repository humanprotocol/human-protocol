// This file defines chains that will be available in wallet-connect modal
// according to docs: https://docs.walletconnect.com/web3modal/react/about.
// For particular chains we define set of smart contract addresses.
// Thanks to that we can get addresses for selected chain with getContractAddress
// function

import type { Chain } from '@web3modal/scaffold-utils/ethers';
import {
  MainnetContracts,
  TestnetContracts,
  type ContractsAddresses,
} from '@/smart-contracts/contracts';
import { env } from '@/shared/env';

export type ChainWithAddresses = Chain & {
  addresses: ContractsAddresses;
};

export const TestnetChains: ChainWithAddresses[] = [
  {
    chainId: 80002,
    name: 'Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    currency: 'MATIC',
    explorerUrl: 'https://amoy.polygonscan.com/',
    addresses: TestnetContracts.Amoy,
  },
];

export const MainnetChains: ChainWithAddresses[] = [
  {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com/',
    currency: 'MATIC',
    explorerUrl: 'https://polygonscan.com/',
    addresses: MainnetContracts.Polygon,
  },
];

// chains for getContractAddress function
export const chainsWithSCAddresses: ChainWithAddresses[] =
  env.VITE_NETWORK === 'mainnet' ? MainnetChains : TestnetChains;

// chains for wallet-connect modal
export const chains: Chain[] = (
  env.VITE_NETWORK === 'mainnet' ? MainnetChains : TestnetChains
).map(({ addresses: _, ...chainData }) => chainData);
