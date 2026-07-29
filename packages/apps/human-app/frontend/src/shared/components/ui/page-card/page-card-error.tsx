import { Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import { Button } from '@/shared/components/ui/button';
import { Alert } from '@/shared/components/ui/alert';
import { useColorMode } from '@/shared/contexts/color-mode';
import { commonDarkPageCardStyles, commonPageCardStyles } from './styles';
import { type ErrorMessageProps } from './types';

export function PageCardError({
  errorMessage,
  cardMaxWidth = '100%',
}: ErrorMessageProps) {
  const { isDarkMode } = useColorMode();
  const navigate = useNavigate();

  const commonStyleForTheme = isDarkMode
    ? commonDarkPageCardStyles
    : commonPageCardStyles;

  const sx = cardMaxWidth
    ? { ...commonStyleForTheme, maxWidth: cardMaxWidth }
    : commonStyleForTheme;

  return (
    <Grid container sx={{ ...sx, gap: 2 }}>
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
    </Grid>
  );
}
