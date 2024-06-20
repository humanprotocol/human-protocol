import { ChainId } from '@human-protocol/sdk';

export interface IFaucetData {
  rpcUrl: string;
}

export const FAUCET_NETWORKS: {
  [chainId in ChainId]?: IFaucetData;
} = {
  [ChainId.SEPOLIA]: {
    rpcUrl: process.env.RPC_URL_SEPOLIA || '',
  },
  [ChainId.BSC_TESTNET]: {
    rpcUrl: process.env.RPC_URL_BSC_TESTNET || '',
  },
  [ChainId.POLYGON_AMOY]: {
    rpcUrl: process.env.RPC_URL_POLYGON_AMOY || '',
  },
  [ChainId.MOONBASE_ALPHA]: {
    rpcUrl: process.env.RPC_URL_MOONBASE_ALPHA || '',
  },
  [ChainId.AVALANCHE_TESTNET]: {
    rpcUrl: process.env.RPC_URL_AVALANCHE_TESTNET || '',
  },
  [ChainId.CELO_ALFAJORES]: {
    rpcUrl: process.env.RPC_URL_CELO_ALFAJORES || '',
  },
  [ChainId.XLAYER_TESTNET]: {
    rpcUrl: process.env.RPC_URL_XLAYER_TESTNET || '',
  },
  [ChainId.LOCALHOST]: {
    rpcUrl: process.env.RPC_PORT
      ? `http://127.0.0.1:${process.env.RPC_PORT}`
      : '',
  },
};
