import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { shortenEscrowAddress } from '@/shared/helpers/evm';
import { breakpoints } from '@/shared/styles/breakpoints';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useColorMode } from '@/shared/hooks/use-color-mode';

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
            color: colorPalette.text.primary,
          },
        }}
        variant="body2"
      >
        {shortAddress}
      </Typography>
    </Tooltip>
  );
}
