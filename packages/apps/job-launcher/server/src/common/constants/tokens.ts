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
    [EscrowFundToken.USDT]: {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      decimals: 6,
    },
    [EscrowFundToken.USDC]: {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      decimals: 6,
    },
  },
  [ChainId.SEPOLIA]: {
    [EscrowFundToken.HMT]: {
      address: NETWORKS[ChainId.SEPOLIA]!.hmtAddress,
      decimals: 18,
    },
    [EscrowFundToken.USDT]: {
      address: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
      decimals: 6,
    },
    [EscrowFundToken.USDC]: {
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
      decimals: 6,
    },
  },
  [ChainId.BSC_MAINNET]: {
    [EscrowFundToken.HMT]: {
      address: NETWORKS[ChainId.BSC_MAINNET]!.hmtAddress,
      decimals: 18,
    },
  },
  [ChainId.POLYGON]: {
    [EscrowFundToken.HMT]: {
      address: NETWORKS[ChainId.POLYGON]!.hmtAddress,
      decimals: 18,
    },
    [EscrowFundToken.USDT0]: {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      decimals: 6,
    },
    // Disabled
    // [EscrowFundToken.USDC]: {
    //   address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    //   decimals: 6,
    // },
  },
  [ChainId.POLYGON_AMOY]: {
    [EscrowFundToken.HMT]: {
      address: NETWORKS[ChainId.POLYGON_AMOY]!.hmtAddress,
      decimals: 18,
    },
    [EscrowFundToken.USDC]: {
      address: '0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582',
      decimals: 6,
    },
  },
  [ChainId.AURORA_TESTNET]: {
    [EscrowFundToken.HMT]: {
      address: NETWORKS[ChainId.AURORA_TESTNET]!.hmtAddress,
      decimals: 18,
    },
  },
  [ChainId.LOCALHOST]: {
    [EscrowFundToken.HMT]: {
      address: NETWORKS[ChainId.LOCALHOST]!.hmtAddress,
      decimals: 18,
    },
  },
  [ChainId.BSC_TESTNET]: {
    [EscrowFundToken.HMT]: {
      address: NETWORKS[ChainId.BSC_TESTNET]!.hmtAddress,
      decimals: 18,
    },
  },
};
