import type { SxProps, Theme } from '@mui/material';
import { Box, Grid, Typography, styled } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { breakpoints } from '@/styles/theme';
import { routerPaths } from '@/router/router-paths';
import { colorPalette } from '@/styles/color-palette';
import { useBackgroundColorStore } from '@/hooks/use-background-store';
import { Loader } from '@/components/ui/loader';
import { Alert } from '@/components/ui/alert';

const DEFAULT_CARD_MAX_WIDTH = '1200px';

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
}));

const getCommonStyles: (cardMaxWidth: string) => SxProps<Theme> = (
  cardMaxWidth
) => {
  return {
    padding: '2rem 2rem 6rem 2rem',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '2rem',
    borderRadius: '20px',
    minHeight: '70vh',
    maxWidth: cardMaxWidth,
    width: '100%',
    background: colorPalette.white,
    [breakpoints.mobile]: {
      borderRadius: '0',
    },
  };
};

interface FormCardProps {
  children: React.JSX.Element;
  title?: React.JSX.Element | string;
  alert?: React.JSX.Element;
  cardMaxWidth?: string;
  childrenMaxWidth?: string;
  backArrowPath?: string | -1;
  cancelBtnPath?: string | -1;
  withLayoutBackground?: boolean;
  loader?: boolean;
}

export function PageCard({
  children,
  title,
  alert,
  cardMaxWidth = DEFAULT_CARD_MAX_WIDTH,
  childrenMaxWidth = '486px',
  backArrowPath,
  cancelBtnPath = routerPaths.homePage,
  withLayoutBackground = true,
}: FormCardProps) {
  const { setGrayBackground } = useBackgroundColorStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

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
    <Grid container sx={getCommonStyles(cardMaxWidth)}>
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
        <Button onClick={goBack.bind(null, cancelBtnPath)}>
          <Typography variant="buttonMedium">
            {t('components.modal.header.closeBtn')}
          </Typography>
        </Button>
      </Grid>
      <Box
        sx={{
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
              },
            }}
          >
            {backArrowPath ? (
              <IconWrapper onClick={goBack.bind(null, backArrowPath)}>
                <ArrowBackIcon />
              </IconWrapper>
            ) : null}
            <Button onClick={goBack.bind(null, cancelBtnPath)}>
              <Typography variant="buttonMedium">
                {t('components.modal.header.closeBtn')}
              </Typography>
            </Button>
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
                <ArrowBackIcon />
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
      </Box>
    </Grid>
  );
}

export function PageCardLoader({
  cardMaxWidth = DEFAULT_CARD_MAX_WIDTH,
  withLayoutBackground = true,
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
  return (
    <Grid container sx={getCommonStyles(cardMaxWidth)}>
      <Loader size={90} />
    </Grid>
  );
}
export function PageCardError({
  errorMessage,
  cardMaxWidth = DEFAULT_CARD_MAX_WIDTH,
  withLayoutBackground,
}: {
  errorMessage: string;
  cardMaxWidth?: string;
  withLayoutBackground?: boolean;
}) {
  const navigate = useNavigate();
  const { setGrayBackground } = useBackgroundColorStore();

  useEffect(() => {
    if (withLayoutBackground) {
      setGrayBackground();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- call this effect once
  }, []);
  return (
    <Grid container sx={getCommonStyles(cardMaxWidth)}>
      <Alert color="error" severity="error">
        {errorMessage}
      </Alert>
      <Button onClick={navigate.bind(null, 0)} variant="contained">
        Reload
      </Button>
      <Button
        onClick={navigate.bind(null, routerPaths.homePage)}
        variant="outlined"
      >
        Go Home
      </Button>
    </Grid>
  );
}
