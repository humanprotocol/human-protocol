import { Grid, Typography, styled } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import { Button } from '@/shared/components/ui/button';
import { breakpoints } from '@/shared/styles/breakpoints';
import { routerPaths } from '@/router/router-paths';
import { onlyDarkModeColor } from '@/shared/styles/dark-color-palette';
import { useColorMode } from '@/shared/contexts/color-mode';
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

type NavigationTarget = string | (() => void);

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
  backNavigation,
  maxContentWidth = '376px',
  childrenMaxWidth = '486px',
  cancelNavigation = routerPaths.homePage,
  showCancelButton = true,
  showBackButton = true,
}: PageCardProps) {
  const { isDarkMode, colorPalette } = useColorMode();
  const navigate = useNavigate();
  const isMobile = useIsMobile('md');

  const contentStyles = {
    maxWidth: maxContentWidth,
    width: '100%',
    [breakpoints.mobile]: {
      maxWidth: 'unset',
    },
  };

  const goBack = (navigationTarget: NavigationTarget | undefined) => {
    if (navigationTarget instanceof Function) {
      navigationTarget();
      return;
    }
    if (typeof navigationTarget === 'string') {
      navigate(navigationTarget);
      return;
    }
    navigate(-1);
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
            columnGap: '1rem',
            rowGap: { xs: '0.4rem', md: '1rem' },
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
            {showBackButton && (
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
          <Grid size={{ xs: 12, md: 1 }} sx={{ order: { xs: 3, md: 1 } }} />
          <Grid
            size={{ xs: 12, md: 10 }}
            sx={{
              minHeight: '3rem',
              width: '100%',
              order: 2,
              [breakpoints.mobile]: {
                height: 'auto',
                minHeight: 'unset',
              },
            }}
          >
            <Grid sx={contentStyles}>{alert && <>{alert}</>}</Grid>
          </Grid>
          <Grid
            size={{ xs: 12, md: 1 }}
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              mt: '5px',
              order: 3,
              [breakpoints.mobile]: {
                display: 'none',
                order: 1,
              },
            }}
          >
            {showBackButton && (
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
          <Grid size={{ xs: 12, md: 10 }} sx={{ mb: 3, order: 4 }}>
            <Grid sx={contentStyles}>
              {typeof title === 'string' ? (
                <Typography variant="h4">{title}</Typography>
              ) : (
                title
              )}
            </Grid>
          </Grid>
          <Grid size={1} sx={{ order: 5 }} />
          <Grid size={{ xs: 12, md: 10 }} sx={{ order: 6 }}>
            <Grid sx={contentStyles}>{children}</Grid>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}
