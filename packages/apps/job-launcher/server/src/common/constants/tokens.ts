import { ChainId, NETWORKS } from '@human-protocol/sdk';
import { EscrowFundToken } from '../enums/job';

export const TOKEN_ADDRESSES: {
  [chainId in ChainId]?: {
    [token in EscrowFundToken]?: string;
  };
} = {
  [ChainId.MAINNET]: {
    [EscrowFundToken.HMT]: NETWORKS[ChainId.MAINNET]?.hmtAddress,
    [EscrowFundToken.USDT]: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    [EscrowFundToken.USDC]: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606EB48',
  },
  [ChainId.SEPOLIA]: {
    [EscrowFundToken.HMT]: NETWORKS[ChainId.SEPOLIA]?.hmtAddress,
    [EscrowFundToken.USDT]: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
    [EscrowFundToken.USDC]: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  },
  [ChainId.BSC_MAINNET]: {
    [EscrowFundToken.HMT]: NETWORKS[ChainId.BSC_MAINNET]?.hmtAddress,
    [EscrowFundToken.USDT]: '0x55d398326f99059fF775485246999027B3197955',
    [EscrowFundToken.USDC]: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
  },
  [ChainId.POLYGON]: {
    [EscrowFundToken.HMT]: NETWORKS[ChainId.POLYGON]?.hmtAddress,
    [EscrowFundToken.USDT]: '0x3813e82e6f7098b9583FC0F33a962D02018B6803',
    [EscrowFundToken.USDC]: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  },
  [ChainId.POLYGON_AMOY]: {
    [EscrowFundToken.HMT]: NETWORKS[ChainId.POLYGON_AMOY]?.hmtAddress,
    [EscrowFundToken.USDC]: '0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582',
  },
  [ChainId.LOCALHOST]: {
    [EscrowFundToken.HMT]: NETWORKS[ChainId.LOCALHOST]?.hmtAddress,
    [EscrowFundToken.USDC]: '0x09635F643e140090A9A8Dcd712eD6285858ceBef',
  },
};
