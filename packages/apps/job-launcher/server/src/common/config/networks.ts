import { ChainId, NETWORKS } from '@human-protocol/sdk';

export interface TokensList {
  [key: string]: string | undefined;
}
export interface NetworkDto {
  chainId: number;
  rpcUrl: string;
  tokens: TokensList;
}

interface NetworkMapDto {
  [key: string]: NetworkDto;
}

export const networkMap: NetworkMapDto = {
  polygon: {
    chainId: ChainId.POLYGON,
    rpcUrl:
      'https://polygon-mainnet.infura.io/v3/a9728d7d00a14a3d822c923a8978c5a5',
    tokens: {
      hmt: NETWORKS[ChainId.POLYGON]?.hmtAddress,
      usdt: '0x170a18b9190669cda08965562745a323c907e5ec',
    },
  },
  bsc: {
    chainId: ChainId.BSC_MAINNET,
    rpcUrl: 'https://bsc-dataseed1.binance.org/',
    tokens: {
      hmt: NETWORKS[ChainId.BSC_MAINNET]?.hmtAddress,
      usdt: '0x55d398326f99059fF775485246999027B3197955',
    },
  },
  mumbai: {
    chainId: ChainId.POLYGON_MUMBAI,
    rpcUrl:
      'https://polygon-mumbai.g.alchemy.com/v2/vKNSJzJf6SW2sdW-05bgFwoyFxUrMzii',
    tokens: {
      hmt: NETWORKS[ChainId.POLYGON_MUMBAI]?.hmtAddress,
      usdt: '0x5b20e68f501590C130d77C87C2A2f2B43Fc09701',
    },
  },
  goerli: {
    chainId: ChainId.GOERLI,
    rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    tokens: {
      hmt: NETWORKS[ChainId.GOERLI]?.hmtAddress,
    },
  },
  moonbeam: {
    chainId: ChainId.MOONBEAM,
    rpcUrl: 'https://rpc.api.moonbeam.network',
    tokens: {
      hmt: NETWORKS[ChainId.MOONBEAM]?.hmtAddress,
    },
  },
  bsctest: {
    chainId: ChainId.BSC_TESTNET,
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    tokens: {
      hmt: NETWORKS[ChainId.BSC_TESTNET]?.hmtAddress,
    },
  },
  localhost: {
    chainId: ChainId.LOCALHOST,
    rpcUrl: 'http://0.0.0.0:8545',
    tokens: {
      hmt: NETWORKS[ChainId.LOCALHOST]?.hmtAddress,
    },
  },
};

export const networks = Object.values(networkMap).map((network) => network);
