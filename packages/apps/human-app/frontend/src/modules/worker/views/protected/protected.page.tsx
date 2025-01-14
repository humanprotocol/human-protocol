import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';

export function ProtectedPage() {
  const { t } = useTranslation();

  return (
    <Box>
      <div>{t('protectedPage.header')}</div>
    </Box>
  );
}
