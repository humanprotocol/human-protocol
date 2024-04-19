import { ChainId } from '@human-protocol/sdk';

export interface NetworkDto {
  chainId: ChainId;
  rpcUrl: string;
}

interface NetworkMapDto {
  [key: string]: NetworkDto;
}

export const networkMap: NetworkMapDto = {
  polygon: {
    chainId: ChainId.POLYGON,
    rpcUrl:
      'https://polygon-mainnet.g.alchemy.com/v2/ApMluTj0_OBDUcLV01MYMHbxI7EmCJ6r',
  },
  bsc: {
    chainId: ChainId.BSC_MAINNET,
    rpcUrl: 'https://bsc-dataseed1.binance.org/',
  },
  amoy: {
    chainId: ChainId.POLYGON_AMOY,
    rpcUrl:
      'https://polygon-amoy.g.alchemy.com/v2/Jomagi_shxwCUrKtZfgZepvngWRuO8-e',
  },
  sepolia: {
    chainId: ChainId.SEPOLIA,
    rpcUrl:
      'https://eth-sepolia.g.alchemy.com/v2/sboTD6vQ1csb0uxeeh6ex3EqSLE-vMWh',
  },
  moonbeam: {
    chainId: ChainId.MOONBEAM,
    rpcUrl: 'https://rpc.api.moonbeam.network',
  },
  bsctest: {
    chainId: ChainId.BSC_TESTNET,
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  },
  localhost: {
    chainId: ChainId.LOCALHOST,
    rpcUrl: 'http://0.0.0.0:8545',
  },
};

export const networks = Object.values(networkMap).map((network) => network);

export const TESTNET_CHAIN_IDS = [
  ChainId.BSC_TESTNET,
  ChainId.POLYGON_AMOY,
  ChainId.SEPOLIA,
];

export const MAINNET_CHAIN_IDS = [
  ChainId.BSC_MAINNET,
  ChainId.POLYGON,
  ChainId.MOONBEAM,
];

export const LOCALHOST_CHAIN_IDS = [ChainId.LOCALHOST];
