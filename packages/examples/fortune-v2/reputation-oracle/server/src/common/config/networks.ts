export interface NetworkDto {
  chainId: number;
  rpcUrl: string;
}

interface NetworkMapDto {
  [key: string]: NetworkDto;
}

export const networkMap: NetworkMapDto = {
  polygon: {
    chainId: 137,
    rpcUrl:
      'https://polygon-mainnet.g.alchemy.com/v2/0Lorh5KRkGl5FsRwy2epTg8fEFFoqUfY',
  },
  bsc: {
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed1.binance.org/',
  },
  mumbai: {
    chainId: 80001,
    rpcUrl:
      'https://polygon-mumbai.g.alchemy.com/v2/vKNSJzJf6SW2sdW-05bgFwoyFxUrMzii',
  },
  goerli: {
    chainId: 5,
    rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  },
  moonbeam: {
    chainId: 1284,
    rpcUrl: 'https://rpc.api.moonbeam.network',
  },
  bsctest: {
    chainId: 97,
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  },
};

export const networks = Object.values(networkMap).map((network) => network);
