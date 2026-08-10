import { ReactElement } from 'react';
import { ChainId } from '@human-protocol/sdk/src/enums';

import { EthereumIcon, PolygonIcon } from './icons';
import { Stack, Tooltip } from '@mui/material';
import { getNetworkName } from '@/modules/smart-contracts/get-network-name';

const CHAIN_ICONS: Partial<Record<number, ReactElement>> = {
  [ChainId.MAINNET]: <EthereumIcon />,
  [ChainId.SEPOLIA]: <EthereumIcon />,
  [ChainId.POLYGON]: <PolygonIcon />,
  [ChainId.POLYGON_AMOY]: <PolygonIcon />,
};

export function ChainIcon({ chainId }: { chainId: number }) {
  if (!CHAIN_ICONS[chainId]) {
    return null;
  }

  return (
    <Tooltip title={getNetworkName(chainId)} placement="top">
      <Stack
        sx={{
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        {CHAIN_ICONS[chainId]}
      </Stack>
    </Tooltip>
  );
}
