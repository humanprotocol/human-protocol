import { Paper, Stack } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useWorkerIdentityVerificationStatus } from '@/modules/worker/profile/hooks';
import { routerPaths } from '@/router/router-paths';
import { OraclesTableJobTypesSelect, OraclesTable } from './components';

export function JobsDiscoveryPage() {
  const isMobile = useIsMobile();
  const { isVerificationCompleted } = useWorkerIdentityVerificationStatus();

  if (!isVerificationCompleted) {
    return <Navigate to={routerPaths.worker.profile} replace />;
  }

  return (
    <Stack sx={{ alignItems: 'center', justifyContent: 'center' }}>
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          height: '100%',
          padding: isMobile ? '20px' : '64px 144px',
          minHeight: '800px',
          borderRadius: '20px',
        }}
      >
        <OraclesTableJobTypesSelect />
        <OraclesTable />
      </Paper>
    </Stack>
  );
}
