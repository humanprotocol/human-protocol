import { Tooltip, Typography } from '@mui/material';

import { shortenEscrowAddress } from '@/shared/helpers/evm';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

export function EvmAddress({ address }: { address: string }) {
  const isMobile = useIsMobile();
  const shortAddress = shortenEscrowAddress(address, 4, 4);

  return (
    <Tooltip title={address}>
      <Typography
        variant={isMobile ? 'body2' : 'body1'}
        sx={{ color: 'text.auxiliary100', fontWeight: 500 }}
      >
        {shortAddress}
      </Typography>
    </Tooltip>
  );
}
