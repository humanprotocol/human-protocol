import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import type { UseQueryResult } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { OraclesTable } from '@/pages/worker/jobs-discovery/oracles-table/oracles-table';
import { OraclesTableJobTypesSelect } from '@/pages/worker/jobs-discovery/oracles-table/oracles-table-job-types-select';
import type { OraclesSuccessResponse } from '@/api/services/worker/oracles';
import { useGetOracles } from '@/api/services/worker/oracles';

export type OraclesDataQueryResult = UseQueryResult<OraclesSuccessResponse>;

export function JobsDiscoveryPage() {
  const oraclesQueryResult = useGetOracles();
  const isMobile = useIsMobile();

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
