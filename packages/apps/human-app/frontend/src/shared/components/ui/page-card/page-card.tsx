import { Grid, Typography, styled } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { t } from 'i18next';
import { Button } from '@/shared/components/ui/button';
import { breakpoints } from '@/shared/styles/breakpoints';
import { routerPaths } from '@/router/router-paths';
import { useBackgroundColorStore } from '@/shared/hooks/use-background-store';
import { onlyDarkModeColor } from '@/shared/styles/dark-color-palette';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { commonDarkPageCardStyles, commonPageCardStyles } from './consts';

const IconWrapper = styled('div')(() => ({
  width: '40px',
  height: '40px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '50%',
  cursor: 'pointer',
  ':hover': {
    cursor: 'pointer',
  },
  fontSize: '26px',
}));

type ButtonsProps = string | -1 | (() => void);

interface FormCardProps {
  children: React.JSX.Element;
  maxContentWidth?: string;
  childrenMaxWidth?: string;
  title?: React.JSX.Element | string;
  alert?: React.JSX.Element;
  backArrowPath?: ButtonsProps;
  cancelRouterPathOrCallback?: ButtonsProps;
  hiddenCancelButton?: boolean;
  hiddenArrowButton?: boolean;
  withLayoutBackground?: boolean;
  loader?: boolean;
}

export function PageCard({
  children,
  title,
  alert,
  maxContentWidth = '376px',
  childrenMaxWidth = '486px',
  backArrowPath = -1,
  cancelRouterPathOrCallback = routerPaths.homePage,
  withLayoutBackground = true,
  hiddenCancelButton = false,
  hiddenArrowButton = false,
}: FormCardProps) {
  const { isDarkMode, colorPalette } = useColorMode();
  const { setGrayBackground } = useBackgroundColorStore();
  const navigate = useNavigate();
  const isMobile = useIsMobile('md');
  const contentStyles = {
    maxWidth: maxContentWidth,
    width: '100%',
    [breakpoints.mobile]: {
      maxWidth: 'unset',
    },
  };

  useEffect(() => {
    if (withLayoutBackground && !isDarkMode) {
      setGrayBackground();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- call this effect once
  }, []);

  const goBack = (pathOrCallback: ButtonsProps) => {
    if (pathOrCallback instanceof Function) {
      pathOrCallback();
      return;
    }
    if (typeof pathOrCallback === 'string') {
      navigate(pathOrCallback);
      return;
    }
    navigate(pathOrCallback);
  };

  return (
    <Grid
      container
      sx={{
        ...(isDarkMode ? commonDarkPageCardStyles : commonPageCardStyles),
        padding: isMobile ? '0 2rem 7.25rem 2rem' : '2rem 2rem 7.7rem 2rem',
      }}
    >
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
          [breakpoints.mobile]: {
            maxWidth: '100%',
          },
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
            {backArrowPath && !hiddenArrowButton && (
              <IconWrapper
                onClick={goBack.bind(null, backArrowPath)}
                sx={{
                  width: '25px',
                  height: '25px',
                  fontSize: '18px',
                  backgroundColor: isDarkMode
                    ? onlyDarkModeColor.backArrowBg
                    : colorPalette.paper.main,
                }}
              >
                <ArrowBackIcon fontSize="inherit" />
              </IconWrapper>
            )}
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
            <Grid sx={contentStyles}>{alert && <>{alert}</>}</Grid>
          </Grid>
          <Grid
            item
            md={1}
            order={{ xs: 1, md: 3 }}
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              mt: '5px',
              [breakpoints.mobile]: {
                display: 'none',
              },
            }}
            xs={12}
          >
            {backArrowPath && !hiddenArrowButton && (
              <IconWrapper
                onClick={goBack.bind(null, backArrowPath)}
                sx={{
                  backgroundColor: isDarkMode
                    ? onlyDarkModeColor.backArrowBg
                    : colorPalette.paper.main,
                }}
              >
                <ArrowBackIcon fontSize="inherit" />
              </IconWrapper>
            )}
          </Grid>
          <Grid
            item
            md={10}
            order={{ xs: 4, md: 4 }}
            sx={{ marginBottom: '24px' }}
            xs={12}
          >
            <Grid sx={contentStyles}>
              <Typography variant="h4">{title}</Typography>
            </Grid>
          </Grid>
          <Grid item md={1} order={{ xs: 5, md: 5 }} xs={1} />
          <Grid item md={10} order={{ xs: 6, md: 6 }} xs={12}>
            <Grid sx={contentStyles}>{children}</Grid>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
