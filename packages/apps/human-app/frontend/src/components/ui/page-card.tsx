import type { SxProps, Theme } from '@mui/material';
import { Grid, Typography, styled } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { t } from 'i18next';
import { Button } from '@/components/ui/button';
import { breakpoints } from '@/styles/theme';
import { routerPaths } from '@/router/router-paths';
import { colorPalette } from '@/styles/color-palette';
import { useBackgroundColorStore } from '@/hooks/use-background-store';
import { Loader } from '@/components/ui/loader';
import { Alert } from '@/components/ui/alert';

const IconWrapper = styled('div')(() => ({
  width: '40px',
  height: '40px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '50%',
  backgroundColor: colorPalette.paper.main,
  cursor: 'pointer',
  ':hover': {
    cursor: 'pointer',
  },
  fontSize: '26px',
}));

const commonStyles: SxProps<Theme> = {
  padding: '2rem 2rem 6rem 2rem',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '20px',
  minHeight: '70vh',
  maxWidth: '1200px',
  width: '100%',
  background: colorPalette.white,
};

interface FormCardProps {
  children: React.JSX.Element;
  title?: React.JSX.Element | string;
  alert?: React.JSX.Element;
  childrenMaxWidth?: string;
  backArrowPath?: string | -1;
  cancelRouterPathOrCallback?: string | -1 | (() => void);
  hiddenCancelButton?: boolean;
  withLayoutBackground?: boolean;
  loader?: boolean;
}

export function PageCard({
  children,
  title,
  alert,
  childrenMaxWidth = '486px',
  backArrowPath = -1,
  cancelRouterPathOrCallback = routerPaths.homePage,
  withLayoutBackground = true,
  hiddenCancelButton = false,
}: FormCardProps) {
  const { setGrayBackground } = useBackgroundColorStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (withLayoutBackground) {
      setGrayBackground();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- call this effect once
  }, []);

  const goBack = (path: string | -1) => {
    if (typeof path === 'string') {
      navigate(path);
      return;
    }
    navigate(path);
  };

  return (
    <Grid container sx={commonStyles}>
      {!hiddenCancelButton && (
        <Grid
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            width: '100%',
            [breakpoints.mobile]: {
              display: 'none',
            },
          }}
        >
          <Button
            onClick={() => {
              if (cancelRouterPathOrCallback instanceof Function) {
                cancelRouterPathOrCallback();
                return;
              }
              goBack(cancelRouterPathOrCallback);
            }}
          >
            <Typography variant="buttonMedium">
              {t('components.modal.header.closeBtn')}
            </Typography>
          </Button>
        </Grid>
      )}
      <Grid
        container
        sx={{
          flexDirection: 'column',
          flexGrow: 1,
          maxWidth: childrenMaxWidth,
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Grid
          container
          sx={{
            rowGap: '1rem',
            columnGap: '1rem',
            [breakpoints.mobile]: {
              rowGap: '0.4rem',
            },
          }}
        >
          <Grid
            sx={{
              display: 'none',
              [breakpoints.mobile]: {
                display: 'flex',
                width: '100%',
                justifyContent: backArrowPath ? 'space-between' : 'flex-end',
                alignItems: 'center',
              },
            }}
          >
            {backArrowPath ? (
              <IconWrapper
                onClick={goBack.bind(null, backArrowPath)}
                sx={{
                  width: '25px',
                  height: '25px',
                  fontSize: '18px',
                }}
              >
                <ArrowBackIcon fontSize="inherit" />
              </IconWrapper>
            ) : null}
            {!hiddenCancelButton && (
              <Button
                onClick={() => {
                  if (cancelRouterPathOrCallback instanceof Function) {
                    cancelRouterPathOrCallback();
                    return;
                  }
                  goBack(cancelRouterPathOrCallback);
                }}
              >
                <Typography variant="buttonMedium">
                  {t('components.modal.header.closeBtn')}
                </Typography>
              </Button>
            )}
          </Grid>
          <Grid item md={1} order={{ xs: 3, md: 1 }} xs={12} />
          <Grid
            item
            md={10}
            order={{ xs: 2, md: 2 }}
            sx={{
              minHeight: '3rem',
              width: '100%',
              [breakpoints.mobile]: {
                height: 'auto',
                minHeight: 'unset',
              },
            }}
            xs={12}
          >
            {alert ? <>{alert}</> : null}
          </Grid>
          <Grid
            item
            md={1}
            order={{ xs: 1, md: 3 }}
            sx={{
              [breakpoints.mobile]: {
                display: 'none',
              },
            }}
            xs={12}
          >
            {backArrowPath ? (
              <IconWrapper onClick={goBack.bind(null, backArrowPath)}>
                <ArrowBackIcon fontSize="inherit" />
              </IconWrapper>
            ) : null}
          </Grid>
          <Grid item md={10} order={{ xs: 4, md: 4 }} xs={12}>
            <Typography variant="h4">{title}</Typography>
          </Grid>
          <Grid item md={1} order={{ xs: 5, md: 5 }} xs={1} />
          <Grid item md={10} order={{ xs: 6, md: 6 }} xs={12}>
            {children}
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}

export function PageCardLoader({
  withLayoutBackground = true,
  cardMaxWidth = '100%',
}: {
  cardMaxWidth?: string;
  withLayoutBackground?: boolean;
}) {
  const { setGrayBackground } = useBackgroundColorStore();

  useEffect(() => {
    if (withLayoutBackground) {
      setGrayBackground();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- call this effect once
  }, []);
  const sx = cardMaxWidth
    ? { ...commonStyles, maxWidth: cardMaxWidth }
    : commonStyles;

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
  const navigate = useNavigate();
  const { setGrayBackground } = useBackgroundColorStore();

  const sx = cardMaxWidth
    ? { ...commonStyles, maxWidth: cardMaxWidth }
    : commonStyles;

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
