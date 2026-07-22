import { Grid, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useColorMode } from '@/shared/contexts/color-mode';
import { commonDarkPageCardStyles, commonPageCardStyles } from './styles';
import { BackButton } from './back-button';

type NavigationTarget = string | (() => void);

interface PageCardProps {
  children: React.JSX.Element;
  maxContentWidth?: string;
  childrenMaxWidth?: string;
  title?: React.JSX.Element | string;
  alert?: React.JSX.Element;
  backNavigation?: NavigationTarget;
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
  showBackButton = true,
}: PageCardProps) {
  const { isDarkMode } = useColorMode();
  const navigate = useNavigate();

  const contentStyles = {
    maxWidth: { xs: 'unset', md: maxContentWidth },
    width: '100%',
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

  return (
    <Grid
      container
      sx={{
        ...(isDarkMode ? commonDarkPageCardStyles : commonPageCardStyles),
        padding: { xs: '0 2rem 7.25rem 2rem', md: '2rem 2rem 7.7rem 2rem' },
      }}
    >
      <Grid
        container
        sx={{
          flexDirection: 'column',
          flexGrow: 1,
          maxWidth: { xs: '100%', md: childrenMaxWidth },
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
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
              display: { xs: 'flex', md: 'none' },
              width: '100%',
              justifyContent: backNavigation ? 'space-between' : 'flex-end',
              alignItems: 'center',
            }}
          >
            {showBackButton && <BackButton onClick={handleBackButton} />}
          </Grid>
          <Grid size={{ xs: 12, md: 1 }} sx={{ order: { xs: 3, md: 1 } }} />
          <Grid
            size={{ xs: 12, md: 10 }}
            sx={{
              minHeight: { xs: 'unset', md: '3rem' },
              height: { xs: 'auto', md: 'unset' },
              width: '100%',
              order: 2,
            }}
          >
            <Grid sx={contentStyles}>{alert && <>{alert}</>}</Grid>
          </Grid>
          <Grid
            size={{ xs: 12, md: 1 }}
            sx={{
              display: { xs: 'none', md: 'flex' },
              justifyContent: 'flex-end',
              mt: '5px',
              order: { xs: 1, md: 3 },
            }}
          >
            {showBackButton && <BackButton onClick={handleBackButton} />}
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
