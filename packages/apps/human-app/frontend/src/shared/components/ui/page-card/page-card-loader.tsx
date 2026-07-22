import { Grid } from '@mui/material';

import { Loader } from '@/shared/components/ui/loader';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useIsMobile } from '@/shared/hooks';

import { commonDarkPageCardStyles, commonPageCardStyles } from './styles';
import { type CommonProps } from './types';

export function PageCardLoader({ cardMaxWidth = '100%' }: CommonProps) {
  const { isDarkMode } = useColorMode();
  const isMobile = useIsMobile();

  const commonStyleForTheme = isDarkMode
    ? commonDarkPageCardStyles
    : commonPageCardStyles;

  const sx = cardMaxWidth
    ? {
        ...commonStyleForTheme,
        maxWidth: cardMaxWidth,
      }
    : commonStyleForTheme;

  return (
    <Grid container sx={sx}>
      <Loader size={isMobile ? 54 : 72} />
    </Grid>
  );
}
