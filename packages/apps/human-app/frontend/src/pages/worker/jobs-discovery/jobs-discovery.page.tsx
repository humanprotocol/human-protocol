import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import type { UseQueryResult } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { OraclesTable } from '@/pages/worker/jobs-discovery/oracles-table/oracles-table';
import { OraclesTableJobTypesSelect } from '@/pages/worker/jobs-discovery/oracles-table/oracles-table-job-types-select';
import { JOB_TYPES } from '@/shared/consts';
import type { OraclesSuccessResponse } from '@/api/services/worker/oracles';
import { useGetOracles } from '@/api/services/worker/oracles';
import { useColorMode } from '@/hooks/use-color-mode';

export type OraclesDataQueryResult = UseQueryResult<OraclesSuccessResponse>;

export function JobsDiscoveryPage() {
  const { colorPalette } = useColorMode();
  const oraclesQueryResult = useGetOracles();
  const isMobile = useIsMobile();

  return (
    <Grid alignItems="center" container justifyContent="center">
      <Grid item xs={12}>
        <Paper
          sx={{
            backgroundColor: isMobile
              ? colorPalette.paper.main
              : colorPalette.white,
            height: '100%',
            boxShadow: 'none',
            padding: isMobile ? '20px' : '40px',
            minHeight: '800px',
            borderRadius: '20px',
          }}
        >
          <OraclesTableJobTypesSelect jobTypes={JOB_TYPES} />
          <OraclesTable oraclesQueryDataResult={oraclesQueryResult} />
        </Paper>
      </Grid>
    </Grid>
  );
}
