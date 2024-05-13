import { ChainId } from '@human-protocol/sdk';
import { ReactElement } from 'react';

import { AvalancheIcon } from './AvalancheIcon';
import { BinanceSmartChainIcon } from './BinanceSmartChainIcon';
import { CeloIcon } from './CeloIcon';
import { EthereumIcon } from './EthereumIcon';
import { HumanIcon } from './HumanIcon';
import { MoonbaseAlphaIcon } from './MoonbaseAlphaIcon';
import { MoonbeamIcon } from './MoonbeamIcon';
import { OkxIcon } from './OkxIcon';
import { PolygonIcon } from './PolygonIcon';
import { SkaleHumanProtocolIcon } from './SkaleHumanProtocolIcon';
import { XLayerIcon } from './XLayerIcon';

export const CHAIN_ICONS: { [chainId in ChainId]?: ReactElement } = {
  [ChainId.ALL]: <HumanIcon />,
  [ChainId.MAINNET]: <EthereumIcon />,
  [ChainId.GOERLI]: <EthereumIcon />,
  [ChainId.SEPOLIA]: <EthereumIcon />,
  [ChainId.POLYGON]: <PolygonIcon />,
  [ChainId.POLYGON_MUMBAI]: <PolygonIcon />,
  [ChainId.POLYGON_AMOY]: <PolygonIcon />,
  [ChainId.BSC_MAINNET]: <BinanceSmartChainIcon />,
  [ChainId.BSC_TESTNET]: <BinanceSmartChainIcon />,
  [ChainId.MOONBEAM]: <MoonbeamIcon />,
  [ChainId.MOONBASE_ALPHA]: <MoonbaseAlphaIcon />,
  [ChainId.AVALANCHE]: <AvalancheIcon />,
  [ChainId.AVALANCHE_TESTNET]: <AvalancheIcon />,
  [ChainId.SKALE]: <SkaleHumanProtocolIcon />,
  [ChainId.CELO]: <CeloIcon />,
  [ChainId.CELO_ALFAJORES]: <CeloIcon />,
  [ChainId.XLAYER_TESTNET]: <OkxIcon />,
  [ChainId.XLAYER]: <XLayerIcon />,
};

export const TOKEN_ICONS: Record<string, ReactElement> = {
  HMT: <HumanIcon />,
};
