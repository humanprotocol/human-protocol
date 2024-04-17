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
  amoy: {
    chainId: ChainId.POLYGON_AMOY,
    rpcUrl:
      'https://polygon-amoy.g.alchemy.com/v2/Jomagi_shxwCUrKtZfgZepvngWRuO8-e',
    tokens: {
      hmt: NETWORKS[ChainId.POLYGON_AMOY]?.hmtAddress,
    },
  },
  sepolia: {
    chainId: ChainId.SEPOLIA,
    rpcUrl:
      'https://eth-sepolia.g.alchemy.com/v2/sboTD6vQ1csb0uxeeh6ex3EqSLE-vMWh',
    tokens: {
      hmt: NETWORKS[ChainId.SEPOLIA]?.hmtAddress,
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
