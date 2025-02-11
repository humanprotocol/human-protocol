import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import type { UseQueryResult } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import type { Oracle } from '@/modules/worker/services/oracles';
import { useGetOracles } from '@/modules/worker/services/oracles';
import { routerPaths } from '@/router/router-paths';
import { useGetOraclesNotifications } from '@/modules/worker/hooks/use-get-oracles-notifications';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { OraclesTableJobTypesSelect } from '@/modules/worker/components/jobs-discovery/oracles-table-job-types-select';
import { OraclesTable } from '@/modules/worker/components/jobs-discovery/oracles-table';

export type OraclesDataQueryResult = UseQueryResult<Oracle[]>;

export function JobsDiscoveryPage() {
  const { onError } = useGetOraclesNotifications();
  const onErrorRef = useRef(onError);
  const oraclesQueryResult = useGetOracles();
  const isMobile = useIsMobile();
  const { user } = useAuthenticatedUser();

  useEffect(() => {
    if (oraclesQueryResult.error) {
      onErrorRef.current(oraclesQueryResult.error);
    }
  }, [oraclesQueryResult.error]);

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
          <OraclesTable oraclesQueryDataResult={oraclesQueryResult} />
        </Paper>
      </Grid>
    </Grid>
  );
}
