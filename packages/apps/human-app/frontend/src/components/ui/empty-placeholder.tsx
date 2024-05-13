import Typography from '@mui/material/Typography';
import { t } from 'i18next';
import { colorPalette } from '@/styles/color-palette';

export function EmptyPlaceholder() {
  return (
    <Typography color={colorPalette.text.disabled} variant="helperText">
      {t('operator.addKeysPage.existingKeys.noValue')}
    </Typography>
  );
}
