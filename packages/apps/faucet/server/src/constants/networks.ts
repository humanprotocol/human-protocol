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
  [ChainId.LOCALHOST]: {
    rpcUrl: process.env.RPC_PORT
      ? `http://127.0.0.1:${process.env.RPC_PORT}`
      : '',
  },
};
