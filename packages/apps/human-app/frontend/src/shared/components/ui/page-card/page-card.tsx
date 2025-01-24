import { Grid, Typography, styled } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import { Button } from '@/shared/components/ui/button';
import { breakpoints } from '@/shared/styles/breakpoints';
import { routerPaths } from '@/router/router-paths';
import { onlyDarkModeColor } from '@/shared/styles/dark-color-palette';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { commonDarkPageCardStyles, commonPageCardStyles } from './styles';

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

type NavigationTarget = string | -1 | (() => void);

interface PageCardProps {
  children: React.JSX.Element;
  maxContentWidth?: string;
  childrenMaxWidth?: string;
  title?: React.JSX.Element | string;
  alert?: React.JSX.Element;
  backNavigation?: NavigationTarget;
  cancelNavigation?: NavigationTarget;
  showCancelButton?: boolean;
  showBackButton?: boolean;
  loader?: boolean;
}

export function PageCard({
  children,
  title,
  alert,
  maxContentWidth = '376px',
  childrenMaxWidth = '486px',
  backNavigation = -1,
  cancelNavigation = routerPaths.homePage,
  showCancelButton = false,
  showBackButton = true,
}: Readonly<PageCardProps>) {
  const { isDarkMode, colorPalette } = useColorMode();
  const navigate = useNavigate();
  const isMobile = useIsMobile('md');
  const _showBackButton = backNavigation && showBackButton;

  const contentStyles = {
    maxWidth: maxContentWidth,
    width: '100%',
    [breakpoints.mobile]: {
      maxWidth: 'unset',
    },
  };

  const goBack = (navigationTarget: NavigationTarget) => {
    if (navigationTarget instanceof Function) {
      navigationTarget();
      return;
    }
    if (typeof navigationTarget === 'string') {
      navigate(navigationTarget);
      return;
    }
    navigate(navigationTarget);
  };

  const handleBackButton = () => {
    goBack(backNavigation);
  };

  const handleCancelButton = () => {
    goBack(cancelNavigation);
  };

  return (
    <Grid
      container
      sx={{
        ...(isDarkMode ? commonDarkPageCardStyles : commonPageCardStyles),
        padding: isMobile ? '0 2rem 7.25rem 2rem' : '2rem 2rem 7.7rem 2rem',
      }}
    >
      {showCancelButton && (
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
          <Button onClick={handleCancelButton}>
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
                justifyContent: backNavigation ? 'space-between' : 'flex-end',
                alignItems: 'center',
              },
            }}
          >
            {_showBackButton && (
              <IconWrapper
                onClick={handleBackButton}
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
            {showCancelButton && (
              <Button onClick={handleCancelButton}>
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
            {_showBackButton && (
              <IconWrapper
                onClick={handleBackButton}
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
