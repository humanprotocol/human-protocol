import { Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import { Button } from '@/shared/components/ui/button';
import { routerPaths } from '@/router/router-paths';
import { Alert } from '@/shared/components/ui/alert';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { commonDarkPageCardStyles, commonPageCardStyles } from './styles';

export function PageCardError({
  errorMessage,
  children,
  cardMaxWidth = '100%',
}:
  | {
      errorMessage: string;
      children?: never;
      cardMaxWidth?: string;
    }
  | {
      errorMessage?: never;
      children: React.ReactElement;
      cardMaxWidth?: string;
    }) {
  const { isDarkMode } = useColorMode();
  const navigate = useNavigate();

  const commonStyleForTheme = isDarkMode
    ? commonDarkPageCardStyles
    : commonPageCardStyles;

  const sx = cardMaxWidth
    ? { ...commonStyleForTheme, maxWidth: cardMaxWidth }
    : commonStyleForTheme;

  return (
    <Grid container sx={{ ...sx, gap: '2rem' }}>
      {children ? (
        children
      ) : (
        <>
          <Alert color="error" severity="error">
            {errorMessage}
          </Alert>
          <Button onClick={navigate.bind(null, 0)} variant="contained">
            {t('components.pageCardError.reload')}
          </Button>
          <Button
            onClick={() => {
              navigate(routerPaths.homePage);
            }}
            variant="outlined"
          >
            {t('components.pageCardError.goHome')}
          </Button>
        </>
      )}
    </Grid>
  );
}
