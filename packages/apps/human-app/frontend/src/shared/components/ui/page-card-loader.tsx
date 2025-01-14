import type { SxProps, Theme } from '@mui/material';
import { Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { t } from 'i18next';
import { Button } from '@/shared/components/ui/button';
import { breakpoints } from '@/shared/styles/breakpoints';
import { routerPaths } from '@/router/router-paths';
import { colorPalette as constColorPalette } from '@/shared/styles/color-palette';
import { useBackgroundColorStore } from '@/shared/hooks/use-background-store';
import { Loader } from '@/shared/components/ui/loader';
import { Alert } from '@/shared/components/ui/alert';
import { darkColorPalette as constDarkColorPalette } from '@/shared/styles/dark-color-palette';
import { useColorMode } from '@/shared/hooks/use-color-mode';

const commonStyles: SxProps<Theme> = {
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '20px',
  minHeight: '70vh',
  maxWidth: '1600px',
  width: '100%',
  background: constColorPalette.white,
};

const commonStylesDark: SxProps<Theme> = {
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '20px',
  minHeight: '70vh',
  maxWidth: '1600px',
  width: '100%',
  background: constDarkColorPalette.paper.main,
  [breakpoints.mobile]: {
    background: constDarkColorPalette.backgroundColor,
  },
};

export function PageCardLoader({
  withLayoutBackground = true,
  cardMaxWidth = '100%',
}: {
  cardMaxWidth?: string;
  withLayoutBackground?: boolean;
}) {
  const { isDarkMode } = useColorMode();
  const { setGrayBackground } = useBackgroundColorStore();

  useEffect(() => {
    if (withLayoutBackground) {
      setGrayBackground();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- call this effect once
  }, []);

  const commonStyleForTheme = isDarkMode ? commonStylesDark : commonStyles;

  const sx = cardMaxWidth
    ? {
        ...commonStyleForTheme,
        maxWidth: cardMaxWidth,
      }
    : commonStyleForTheme;

  return (
    <Grid container sx={sx}>
      <Loader size={90} />
    </Grid>
  );
}
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
  const commonStyleForTheme = isDarkMode ? commonStylesDark : commonStyles;

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
