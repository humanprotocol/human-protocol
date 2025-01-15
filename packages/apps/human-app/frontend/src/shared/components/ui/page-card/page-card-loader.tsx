import { Grid } from '@mui/material';
import { Loader } from '@/shared/components/ui/loader';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { commonDarkPageCardStyles, commonPageCardStyles } from './styles';

export function PageCardLoader({
  cardMaxWidth = '100%',
}: {
  cardMaxWidth?: string;
}) {
  const { isDarkMode } = useColorMode();

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
