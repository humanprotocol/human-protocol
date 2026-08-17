import { Box, Container, Grid, Paper } from '@mui/material';
import { Navigate } from 'react-router-dom';

import { LogoSection } from '../components/logo-section';
import { SignInSection } from '../components/sign-in-section';
import { routerPaths } from '@/router/router-paths';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useIsUserVerified } from '@/shared/hooks';

export function HomePage() {
  const { isDarkMode } = useColorMode();
  const isUserVerified = useIsUserVerified();

  if (isUserVerified) {
    return <Navigate replace to={routerPaths.profile} />;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          mx: { xs: 0, md: 4 },
          bgcolor: isDarkMode ? 'background.default' : 'common.white',
        }}
      >
        <Container>
          <Grid
            container
            spacing={{ xs: 0, lg: 10 }}
            sx={{ width: '100%', alignItems: 'center', pb: { xs: 5, lg: 0 } }}
          >
            <Grid
              size={{ xs: 12, lg: 6 }}
              sx={{ justifyContent: 'center', mb: { xs: 4, sm: 8, lg: 0 } }}
            >
              <LogoSection />
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }} sx={{ justifyContent: 'flex-end' }}>
              <SignInSection />
            </Grid>
          </Grid>
        </Container>
      </Paper>
    </Box>
  );
}
