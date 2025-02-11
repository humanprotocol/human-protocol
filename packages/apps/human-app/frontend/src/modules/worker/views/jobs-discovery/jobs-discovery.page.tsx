import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { Navigate } from 'react-router-dom';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { OraclesTableJobTypesSelect } from '@/modules/worker/components/jobs-discovery/components/oracles-table-job-types-select';
import { OraclesTable } from '@/modules/worker/components/jobs-discovery/oracles-table';
import { routerPaths } from '@/router/router-paths';

export function JobsDiscoveryPage() {
  const isMobile = useIsMobile();
  const { user } = useAuthenticatedUser();

  if (user.kyc_status !== 'approved') {
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
