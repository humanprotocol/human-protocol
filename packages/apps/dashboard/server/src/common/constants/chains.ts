import { ChainId as SdkChainId } from '@human-protocol/sdk';

import Environment from '../utils/environment';

export enum ProductionChainId {
  POLYGON_MAINNET = SdkChainId.POLYGON,
  BSC_MAINNET = SdkChainId.BSC_MAINNET,
  ETHEREUM = SdkChainId.MAINNET,
}

export enum DevelopmentChainId {
  POLYGON_AMOY = SdkChainId.POLYGON_AMOY,
  BSC_TESTNET = SdkChainId.BSC_TESTNET,
  SEPOLIA = SdkChainId.SEPOLIA,
  LOCALHOST = SdkChainId.LOCALHOST,
}

export const ChainIds = Object.values(
  Environment.isProduction() ? ProductionChainId : DevelopmentChainId,
).filter((value): value is ChainId => typeof value === 'number');

export type ChainId = ProductionChainId | DevelopmentChainId;
