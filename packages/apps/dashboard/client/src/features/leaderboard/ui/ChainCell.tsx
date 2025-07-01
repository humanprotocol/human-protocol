import { FC } from 'react';

import { ChainId } from '@human-protocol/sdk/src/enums';
import Typography from '@mui/material/Typography';

import { getNetwork } from '@/shared/lib/networks';
import { NetworkIcon } from '@/shared/ui/NetworkIcon';

type Props = {
  chainId: ChainId;
};

const ChainCell: FC<Props> = ({ chainId }) => (
  <Typography
    variant="body1"
    whiteSpace="wrap"
    flexWrap="nowrap"
    alignItems="center"
    display="flex"
    justifyContent="flex-start"
    gap="6px"
    height="100%"
  >
    <NetworkIcon chainId={chainId} />
    {getNetwork(chainId)?.name}
  </Typography>
);

export default ChainCell;
