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
  mumbai: {
    chainId: ChainId.POLYGON_MUMBAI,
    rpcUrl:
      'https://polygon-mumbai.g.alchemy.com/v2/vKNSJzJf6SW2sdW-05bgFwoyFxUrMzii',
  },
  goerli: {
    chainId: ChainId.GOERLI,
    rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
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
    rpcUrl: 'http://0.0.0.0:8545/',
  },
};

export const networks = Object.values(networkMap).map((network) => network);
