import { Grid, Paper, Stack, Typography } from '@mui/material';
import { t } from 'i18next';
import { colorPalette } from '@/styles/color-palette';
import { Chips } from '@/components/ui/chips';
import { TableButton } from '@/components/ui/table-button';
import { Loader } from '@/components/ui/loader';
import { Alert } from '@/components/ui/alert';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import type { OraclesDataQueryResult } from '@/pages/worker/jobs-discovery/jobs-discovery.page';
import { EvmAddress } from '@/pages/worker/jobs/components/evm-address';
import { ListItem } from '@/components/ui/list-item';

export function OraclesTableMobile({
  selectOracle,
  oraclesQueryDataResult: {
    data: oraclesData,
    isError: isOraclesDataError,
    error: oraclesDataError,
    isPending: isOraclesDataPending,
  },
}: {
  selectOracle: (oracleAddress: string, jobTypes: string[]) => void;
  oraclesQueryDataResult: OraclesDataQueryResult;
}) {
  if (isOraclesDataPending) {
    return (
      <Grid
        container
        sx={{ width: '100%', justifyContent: 'center', alignItems: 'center' }}
      >
        <Loader />
      </Grid>
    );
  }

  if (isOraclesDataError) {
    return (
      <Alert color="error" severity="error">
        {defaultErrorMessage(oraclesDataError)}
      </Alert>
    );
  }

  return (
    <Stack flexDirection="column">
      {oraclesData.map((d) => (
        <Paper
          key={crypto.randomUUID()}
          sx={{
            px: '16px',
            py: '32px',
            backgroundColor: colorPalette.white,
            marginBottom: '20px',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: 'none',
          }}
        >
          <Grid item>
            <ListItem label={t('worker.oraclesTable.oracleAddress')}>
              <EvmAddress address={d.address} />
            </ListItem>
            <ListItem label={t('worker.oraclesTable.annotationTool')}>
              <Typography variant="body2">{d.url || ''}</Typography>
            </ListItem>
            <ListItem label={t('worker.oraclesTable.jobTypes')}>
              <Chips data={d.jobTypes} />
            </ListItem>
          </Grid>
          <TableButton
            fullWidth
            onClick={() => {
              selectOracle(d.address, d.jobTypes);
            }}
          >
            {t('worker.oraclesTable.seeJobs')}
          </TableButton>
        </Paper>
      ))}
    </Stack>
  );
}
