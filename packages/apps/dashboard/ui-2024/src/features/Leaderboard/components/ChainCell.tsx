import { Typography } from '@mui/material';
import { NetworkIcon } from '@components/NetworkIcon';
import { getNetwork } from '@utils/config/networks';

export const ChainCell = ({
  chainId,
  isMobile,
}: {
  chainId: number;
  isMobile: boolean;
}) => (
  <Typography
    variant="body1"
    whiteSpace={isMobile ? 'wrap' : 'nowrap'}
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
