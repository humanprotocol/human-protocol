import { Grid } from '@mui/material';
import { useEffect } from 'react';
import { useBackgroundColorStore } from '@/shared/hooks/use-background-store';
import { Loader } from '@/shared/components/ui/loader';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { commonDarkPageCardStyles, commonPageCardStyles } from './consts';

export function PageCardLoader({
  withLayoutBackground = true,
  cardMaxWidth = '100%',
}: {
  cardMaxWidth?: string;
  withLayoutBackground?: boolean;
}) {
  const { isDarkMode } = useColorMode();
  const { setGrayBackground } = useBackgroundColorStore();

  useEffect(() => {
    if (withLayoutBackground) {
      setGrayBackground();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- call this effect once
  }, []);

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
      <Loader size={90} />
    </Grid>
  );
}
