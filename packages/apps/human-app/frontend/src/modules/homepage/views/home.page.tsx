import { Box, Container, Paper } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { routerPaths } from '@/router/router-paths';
import { useColorMode } from '@/shared/contexts/color-mode';
import { Welcome } from '../components/welcome';
import { KycStatus } from '@/modules/worker/profile/types/profile-types';

export function HomePage() {
  const { colorPalette } = useColorMode();
  const { user: worker } = useAuth();

  if (
    worker &&
    worker.kyc_status === KycStatus.APPROVED &&
    worker.wallet_address
  ) {
    return <Navigate replace to={routerPaths.worker.profile} />;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          mx: { xs: 0, md: 4 },
          bgcolor: colorPalette.backgroundColor,
          borderRadius: '20px',
        }}
      >
        <Container sx={{ position: 'relative' }}>
          <Welcome />
        </Container>
      </Paper>
    </Box>
  );
}
