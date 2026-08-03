import { Typography } from '@mui/material';

import { getNetworkName } from '@/modules/smart-contracts/get-network-name';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useIsMobile } from '@/shared/hooks';

export function NetworkName({ chainId }: { chainId: number }) {
  const { colorPalette } = useColorMode();
  const isMobile = useIsMobile();

  return (
    <Typography
      variant={isMobile ? 'body2' : 'body1'}
      sx={{
        color: colorPalette.text.auxiliary100,
        fontWeight: 500,
      }}
    >
      {getNetworkName(chainId)}
    </Typography>
  );
}
