// This file defines chains that will be available in wallet-connect modal
// according to docs: https://docs.walletconnect.com/web3modal/react/about.
// For particular chains we define set of smart contract addresses.
// Thanks to that we can get addresses for selected chain with getContractAddress
// function

import type { Chain } from '@web3modal/scaffold-utils/ethers';
import { ChainId } from '@human-protocol/sdk/src/enums';
import {
  MainnetContracts,
  TestnetContracts,
  type ContractsAddresses,
} from '@/smart-contracts/contracts';
import { env } from '@/shared/env';
import { type ChainIdsEnabled } from '@/api/services/worker/oracles';

const handleFilterChains = (
  chainsArr: ChainWithAddresses[],
  chainIdsEnabled: ChainIdsEnabled
) => {
  return chainsArr.filter((chain) =>
    chainIdsEnabled.some((el) => Number(el) === chain.chainId)
  );
};

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
    addresses: TestnetContracts[80002],
  },
];

export const MainnetChains: ChainWithAddresses[] = [
  {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com/',
    currency: 'MATIC',
    explorerUrl: 'https://polygonscan.com/',
    addresses: MainnetContracts[137],
  },
];

export const AllTestnetsChains: ChainWithAddresses[] = [
  {
    chainId: ChainId.POLYGON_AMOY,
    name: 'Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    currency: 'MATIC',
    explorerUrl: 'https://amoy.polygonscan.com/',
    addresses: TestnetContracts[ChainId.POLYGON_AMOY],
  },
  {
    chainId: ChainId.SEPOLIA,
    name: 'Sepolia',
    rpcUrl: 'https://rpc.sepolia.dev',
    currency: 'ETH',
    explorerUrl: 'https://sepolia.etherscan.io/',
    addresses: TestnetContracts[ChainId.SEPOLIA],
  },
  {
    chainId: ChainId.RINKEBY,
    name: 'Rinkeby',
    rpcUrl: 'https://rinkeby.infura.io/v3/',
    currency: 'ETH',
    explorerUrl: 'https://rinkeby.etherscan.io/',
    addresses: TestnetContracts[ChainId.RINKEBY],
  },
  {
    chainId: ChainId.GOERLI,
    name: 'Goerli',
    rpcUrl: 'https://goerli.infura.io/v3/',
    currency: 'ETH',
    explorerUrl: 'https://goerli.etherscan.io/',
    addresses: TestnetContracts[ChainId.GOERLI],
  },
  {
    chainId: ChainId.BSC_TESTNET,
    name: 'BSC Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    currency: 'BNB',
    explorerUrl: 'https://testnet.bscscan.com/',
    addresses: TestnetContracts[ChainId.BSC_TESTNET],
  },
  {
    chainId: ChainId.POLYGON_MUMBAI,
    name: 'Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com/',
    currency: 'MATIC',
    explorerUrl: 'https://mumbai.polygonscan.com/',
    addresses: TestnetContracts[ChainId.POLYGON_MUMBAI],
  },
  {
    chainId: ChainId.MOONBASE_ALPHA,
    name: 'Moonbase Alpha',
    rpcUrl: 'https://rpc.api.moonbase.moonbeam.network/',
    currency: 'DEV',
    explorerUrl: 'https://moonbase-blockscout.testnet.moonbeam.network/',
    addresses: TestnetContracts[ChainId.MOONBASE_ALPHA],
  },
  {
    chainId: ChainId.AVALANCHE_TESTNET,
    name: 'Avalanche Fuji Testnet',
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    currency: 'AVAX',
    explorerUrl: 'https://testnet.snowtrace.io/',
    addresses: TestnetContracts[ChainId.AVALANCHE_TESTNET],
  },
  {
    chainId: ChainId.CELO_ALFAJORES,
    name: 'Celo Alfajores',
    rpcUrl: 'https://alfajores-forno.celo-testnet.org/',
    currency: 'CELO',
    explorerUrl: 'https://alfajores.celoscan.io/',
    addresses: TestnetContracts[ChainId.CELO_ALFAJORES],
  },
  {
    chainId: ChainId.XLAYER_TESTNET,
    name: 'XLayer Testnet',
    rpcUrl: 'https://rpc.xlayer-testnet.network/',
    currency: 'XLR',
    explorerUrl: 'https://explorer.xlayer-testnet.com/',
    addresses: TestnetContracts[ChainId.XLAYER_TESTNET],
  },
];

export const AllMainnetChains: ChainWithAddresses[] = [
  {
    chainId: ChainId.POLYGON,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com/',
    currency: 'MATIC',
    explorerUrl: 'https://polygonscan.com/',
    addresses: MainnetContracts[ChainId.POLYGON],
  },
  {
    chainId: ChainId.MAINNET,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    currency: 'ETH',
    explorerUrl: 'https://etherscan.io/',
    addresses: MainnetContracts[ChainId.MAINNET],
  },
  {
    chainId: ChainId.BSC_MAINNET,
    name: 'Binance Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    currency: 'BNB',
    explorerUrl: 'https://bscscan.com/',
    addresses: MainnetContracts[ChainId.BSC_MAINNET],
  },
  {
    chainId: ChainId.MOONBEAM,
    name: 'Moonbeam',
    rpcUrl: 'https://rpc.api.moonbeam.network/',
    currency: 'GLMR',
    explorerUrl: 'https://moonscan.io/',
    addresses: MainnetContracts[ChainId.MOONBEAM],
  },
  {
    chainId: ChainId.AVALANCHE,
    name: 'Avalanche',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    currency: 'AVAX',
    explorerUrl: 'https://snowtrace.io/',
    addresses: MainnetContracts[ChainId.AVALANCHE],
  },
  {
    chainId: ChainId.CELO,
    name: 'Celo',
    rpcUrl: 'https://forno.celo.org/',
    currency: 'CELO',
    explorerUrl: 'https://celoscan.io/',
    addresses: MainnetContracts[ChainId.CELO],
  },
  {
    chainId: ChainId.XLAYER,
    name: 'XLayer',
    rpcUrl: 'https://rpc.xlayer-mainnet.network/',
    currency: 'XLR',
    explorerUrl: 'https://explorer.xlayer.com/',
    addresses: MainnetContracts[ChainId.XLAYER],
  },
];

export const getTestnetChainsEnabled = (chainIdsEnabled: ChainIdsEnabled) => {
  return handleFilterChains(AllTestnetsChains, chainIdsEnabled);
};

export const getMainnetChainsEnabled = (chainIdsEnabled: ChainIdsEnabled) => {
  return handleFilterChains(AllMainnetChains, chainIdsEnabled);
};

// chains for getContractAddress function
export const chainsWithSCAddresses: ChainWithAddresses[] =
  env.VITE_NETWORK === 'mainnet' ? MainnetChains : TestnetChains;

// chains for wallet-connect modal
export const chains: Chain[] = (
  env.VITE_NETWORK === 'mainnet' ? MainnetChains : TestnetChains
).map(({ addresses: _, ...chainData }) => chainData);

export const getChainsEnabled = (chainIdsEnabled: ChainIdsEnabled): Chain[] =>
  (env.VITE_NETWORK === 'mainnet'
    ? getMainnetChainsEnabled(chainIdsEnabled)
    : getTestnetChainsEnabled(chainIdsEnabled)
  ).map(({ addresses: _, ...chainData }) => chainData);
