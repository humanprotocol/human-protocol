import Typography from '@mui/material/Typography';
import { t } from 'i18next';
import { useColorMode } from '@/shared/contexts/color-mode';

export function EmptyPlaceholder() {
  const { colorPalette } = useColorMode();

  return (
    <Typography color={colorPalette.text.disabled} variant="helperText">
      {t('operator.addKeysPage.existingKeys.noValue')}
    </Typography>
  );
}
