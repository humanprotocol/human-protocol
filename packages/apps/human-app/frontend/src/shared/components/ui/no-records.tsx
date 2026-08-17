import { Grid } from '@mui/material';
import { t } from 'i18next';

export function NoRecords() {
  return (
    <Grid
      sx={{
        p: 2.5,
        textAlign: 'center',
        fontStyle: 'italic',
        color: 'text.auxiliary100',
      }}
    >
      <span>{t('components.noRecords')}</span>
    </Grid>
  );
}
