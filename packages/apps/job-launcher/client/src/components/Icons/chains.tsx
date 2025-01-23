import { ChainId } from '@human-protocol/sdk';
import { ReactElement } from 'react';

import { BinanceSmartChainIcon } from './BinanceSmartChainIcon';
import { EthereumIcon } from './EthereumIcon';
import { HumanIcon } from './HumanIcon';
import { PolygonIcon } from './PolygonIcon';

export const CHAIN_ICONS: { [chainId in ChainId]?: ReactElement } = {
  [ChainId.ALL]: <HumanIcon />,
  [ChainId.MAINNET]: <EthereumIcon />,
  [ChainId.SEPOLIA]: <EthereumIcon />,
  [ChainId.POLYGON]: <PolygonIcon />,
  [ChainId.POLYGON_AMOY]: <PolygonIcon />,
  [ChainId.BSC_MAINNET]: <BinanceSmartChainIcon />,
  [ChainId.BSC_TESTNET]: <BinanceSmartChainIcon />,
};

export const TOKEN_ICONS: Record<string, ReactElement> = {
  HMT: <HumanIcon />,
};
