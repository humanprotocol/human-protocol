import { ChainId as SdkChainId } from '@human-protocol/sdk';

import Environment from '../utils/environment';

export const ProductionChainId = {
  POLYGON_MAINNET: SdkChainId.POLYGON,
  BSC_MAINNET: SdkChainId.BSC_MAINNET,
  ETHEREUM: SdkChainId.MAINNET,
} as const satisfies Record<string, SdkChainId>;

type ProductionChainId =
  (typeof ProductionChainId)[keyof typeof ProductionChainId];

export const DevelopmentChainId = {
  POLYGON_AMOY: SdkChainId.POLYGON_AMOY,
  BSC_TESTNET: SdkChainId.BSC_TESTNET,
  SEPOLIA: SdkChainId.SEPOLIA,
  LOCALHOST: SdkChainId.LOCALHOST,
} as const satisfies Record<string, SdkChainId>;

type DevelopmentChainId =
  (typeof DevelopmentChainId)[keyof typeof DevelopmentChainId];

export const ChainIds = Object.values(
  Environment.isProduction() ? ProductionChainId : DevelopmentChainId,
).filter((value): value is ChainId => typeof value === 'number');

export type ChainId = ProductionChainId | DevelopmentChainId;

export const TOKEN_CACHE_PREFIX = 'token';
