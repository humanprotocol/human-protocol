import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { shortenEscrowAddress } from '@/shared/helpers/shorten-escrow-address';
import { breakpoints } from '@/styles/theme';
import { colorPalette } from '@/styles/color-palette';

export function EvmAddress({ address }: { address: string }) {
  return (
    <Tooltip title={address}>
      <Typography
        sx={{
          [breakpoints.mobile]: {
            color: colorPalette.secondary.light,
          },
        }}
        variant="body2"
      >
        {shortenEscrowAddress(address)}
      </Typography>
    </Tooltip>
  );
}
