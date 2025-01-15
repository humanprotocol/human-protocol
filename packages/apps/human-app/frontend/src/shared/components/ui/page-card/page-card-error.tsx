import { Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { t } from 'i18next';
import { Button } from '@/shared/components/ui/button';
import { routerPaths } from '@/router/router-paths';
import { useBackgroundColorStore } from '@/shared/hooks/use-background-store';
import { Alert } from '@/shared/components/ui/alert';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { commonDarkPageCardStyles, commonPageCardStyles } from './styles';

export function PageCardError({
  errorMessage,
  children,
  withLayoutBackground,
  cardMaxWidth = '100%',
}:
  | {
      errorMessage: string;
      children?: never;
      cardMaxWidth?: string;
      withLayoutBackground?: boolean;
    }
  | {
      errorMessage?: never;
      children: React.ReactElement;
      cardMaxWidth?: string;
      withLayoutBackground?: boolean;
    }) {
  const { isDarkMode } = useColorMode();
  const navigate = useNavigate();
  const { setGrayBackground } = useBackgroundColorStore();
  const commonStyleForTheme = isDarkMode
    ? commonDarkPageCardStyles
    : commonPageCardStyles;

  const sx = cardMaxWidth
    ? { ...commonStyleForTheme, maxWidth: cardMaxWidth }
    : commonStyleForTheme;

  useEffect(() => {
    if (withLayoutBackground) {
      setGrayBackground();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- call this effect once
  }, []);

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
