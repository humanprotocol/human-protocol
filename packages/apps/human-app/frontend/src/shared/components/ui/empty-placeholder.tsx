import Typography from '@mui/material/Typography';
import { t } from 'i18next';
import { useColorMode } from '@/shared/contexts/color-mode';

export function EmptyPlaceholder() {
  const { colorPalette } = useColorMode();

  return (
    <Typography variant="helperText" sx={{ color: colorPalette.text.disabled }}>
      {t('operator.addKeysPage.existingKeys.noValue')}
    </Typography>
  );
}
