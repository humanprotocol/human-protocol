/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { EscrowFundToken } from '../enums/job';

export const TOKEN_ADDRESSES: {
  [chainId in ChainId]?: {
    [token in EscrowFundToken]?: {
      address: string;
      decimals: number;
    };
  };
} = {
  [ChainId.MAINNET]: {
    [EscrowFundToken.HMT]: {
      address: NETWORKS[ChainId.MAINNET]!.hmtAddress,
      decimals: 18,
    },
    // [EscrowFundToken.USDT]: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
    // [EscrowFundToken.USDC]: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606EB48', decimals: 6 },
  },
  [ChainId.SEPOLIA]: {
    [EscrowFundToken.HMT]: {
      address: NETWORKS[ChainId.SEPOLIA]!.hmtAddress,
      decimals: 18,
    },
    // [EscrowFundToken.USDT]: { address: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0', decimals: 6 },
    // [EscrowFundToken.USDC]: { address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', decimals: 6 },
  },
  [ChainId.BSC_MAINNET]: {
    [EscrowFundToken.HMT]: {
      address: NETWORKS[ChainId.BSC_MAINNET]!.hmtAddress,
      decimals: 18,
    },
    // [EscrowFundToken.USDT]: { address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
    // [EscrowFundToken.USDC]: { address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', decimals: 18 },
  },
  [ChainId.POLYGON]: {
    [EscrowFundToken.HMT]: {
      address: NETWORKS[ChainId.POLYGON]!.hmtAddress,
      decimals: 18,
    },
    // [EscrowFundToken.USDT]: { address: '0x3813e82e6f7098b9583FC0F33a962D02018B6803', decimals: 6 },
    // [EscrowFundToken.USDC]: { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6 },
  },
  [ChainId.POLYGON_AMOY]: {
    [EscrowFundToken.HMT]: {
      address: NETWORKS[ChainId.POLYGON_AMOY]!.hmtAddress,
      decimals: 18,
    },
    // [EscrowFundToken.USDC]: { address: '0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582', decimals: 6 },
  },
  [ChainId.LOCALHOST]: {
    [EscrowFundToken.HMT]: {
      address: NETWORKS[ChainId.LOCALHOST]!.hmtAddress,
      decimals: 18,
    },
    // [EscrowFundToken.USDC]: {
    //   address: '0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f',
    //   decimals: 6,
    // },
  },
};
