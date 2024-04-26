import type { Chain } from '@web3modal/scaffold-utils/ethers';
import {
  MainnetContracts,
  TestnetContracts,
  type ContractsAddresses,
} from '@/smart-contracts/contracts';
// Smart contracts source
// https://docs.humanprotocol.org/human-tech-docs/architecture/components/smart-contracts/contract-addresses

type ChainWithAddresses = Chain & {
  addresses: ContractsAddresses;
};

export const TestnetChains: ChainWithAddresses[] = [
  {
    chainId: 80002,
    name: 'Amoy',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    currency: 'MATIC',
    explorerUrl: 'https://www.oklink.com/amoy',
    addresses: TestnetContracts.Amoy,
  },
  {
    chainId: 5,
    name: 'Ethereum Goerli',
    rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    currency: 'ETH',
    explorerUrl: 'https://goerli.etherscan.io',
    addresses: TestnetContracts.EthereumGoerli,
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
  {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: 'https://cloudflare-eth.com',
    currency: 'ETH',
    explorerUrl: 'https://etherscan.io',
    addresses: MainnetContracts.Ethereum,
  },
];

export const chains = [...TestnetChains, ...MainnetChains];
