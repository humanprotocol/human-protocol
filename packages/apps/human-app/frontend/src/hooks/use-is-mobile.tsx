import type { Breakpoint } from '@mui/material';
import { useTheme, useMediaQuery } from '@mui/material';

export const useIsMobile = (breakpoint?: Breakpoint) => {
  const theme = useTheme();
  const isMobile = !useMediaQuery(
    theme.breakpoints.up(breakpoint ? breakpoint : 'md')
  );
  return isMobile;
};
