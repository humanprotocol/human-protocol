import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { shortenEscrowAddress } from '@/shared/helpers/shorten-escrow-address';
import { breakpoints } from '@/styles/breakpoints';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { useColorMode } from '@/hooks/use-color-mode';

export function EvmAddress({ address }: { address: string }) {
  const { colorPalette } = useColorMode();

  const isMobile = useIsMobile();
  const shortAddress = isMobile
    ? shortenEscrowAddress(address, 4, 4)
    : shortenEscrowAddress(address);

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
        {shortAddress}
      </Typography>
    </Tooltip>
  );
}
