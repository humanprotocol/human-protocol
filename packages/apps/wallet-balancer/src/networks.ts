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
  amoy: {
    chainId: ChainId.POLYGON_AMOY,
    rpcUrl:
      'https://polygon-amoy.g.alchemy.com/v2/Jomagi_shxwCUrKtZfgZepvngWRuO8-e',
    tokens: {
      hmt: NETWORKS[ChainId.POLYGON_AMOY]?.hmtAddress,
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
