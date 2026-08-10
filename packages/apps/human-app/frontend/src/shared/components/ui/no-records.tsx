import { Grid } from '@mui/material';
import { t } from 'i18next';
import { useColorMode } from '@/shared/contexts/color-mode';

export function NoRecords() {
  const { colorPalette } = useColorMode();

  return (
    <Grid
      sx={{
        p: 2.5,
        textAlign: 'center',
        fontStyle: 'italic',
        color: colorPalette.text.auxiliary100,
      }}
    >
      <span>{t('components.noRecords')}</span>
    </Grid>
  );
}
