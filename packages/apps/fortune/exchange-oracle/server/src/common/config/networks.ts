import { ChainId } from '@human-protocol/sdk';

export interface NetworkDto {
  chainId: number;
  rpcUrl: string;
}

interface NetworkMapDto {
  [key: string]: NetworkDto;
}

export const networkMap: NetworkMapDto = {
  polygon: {
    chainId: ChainId.POLYGON,
    rpcUrl:
      'https://polygon-mainnet.g.alchemy.com/v2/0Lorh5KRkGl5FsRwy2epTg8fEFFoqUfY',
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
  goerli: {
    chainId: ChainId.GOERLI,
    rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
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
  xlayer: {
    chainId: ChainId.XLAYER,
    rpcUrl: 'https://rpc.xlayer.tech',
  },
  localhost: {
    chainId: ChainId.LOCALHOST,
    rpcUrl: 'http://0.0.0.0:8545/',
  },
};

export const networks = Object.values(networkMap).map((network) => network);
