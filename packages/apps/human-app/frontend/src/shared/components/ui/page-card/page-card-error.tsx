import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import { Stack } from '@mui/material';

import { Button } from '@/shared/components/ui/button';
import { Alert } from '@/shared/components/ui/alert';
import { type ErrorMessageProps } from './types';
import { commonStyles } from './styles';

export function PageCardError({
  errorMessage,
  cardMaxWidth = '100%',
}: ErrorMessageProps) {
  const navigate = useNavigate();

  const sx = cardMaxWidth
    ? { ...commonStyles, maxWidth: cardMaxWidth }
    : commonStyles;

  return (
    <Stack sx={{ ...sx, gap: 2 }}>
      <Alert color="error" severity="error">
        {errorMessage}
      </Alert>
      <Button
        variant="outlined"
        color="primary"
        sx={{ width: '150px' }}
        onClick={() => {
          navigate(0);
        }}
      >
        {t('components.pageCardError.reload')}
      </Button>
    </Stack>
  );
}
