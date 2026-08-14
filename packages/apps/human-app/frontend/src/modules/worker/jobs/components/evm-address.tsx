import { Tooltip, Typography } from '@mui/material';

import { shortenEscrowAddress } from '@/shared/helpers/evm';

export function EvmAddress({
  address,
  size = 'small',
}: {
  address: string;
  size?: 'small' | 'medium';
}) {
  const shortAddress = shortenEscrowAddress(address, 4, 4);

  return (
    <Tooltip title={address}>
      <Typography
        variant={size === 'small' ? 'body2' : 'body1'}
        sx={{ color: 'text.auxiliary100' }}
      >
        {shortAddress}
      </Typography>
    </Tooltip>
  );
}
