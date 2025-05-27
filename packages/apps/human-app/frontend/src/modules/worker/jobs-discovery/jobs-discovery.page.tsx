import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
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
    <Grid alignItems="center" container justifyContent="center">
      <Grid item xs={12}>
        <Paper
          sx={{
            height: '100%',
            boxShadow: 'none',
            padding: isMobile ? '20px' : '64px 144px',
            minHeight: '800px',
            borderRadius: '20px',
          }}
        >
          <OraclesTableJobTypesSelect />
          <OraclesTable />
        </Paper>
      </Grid>
    </Grid>
  );
}
