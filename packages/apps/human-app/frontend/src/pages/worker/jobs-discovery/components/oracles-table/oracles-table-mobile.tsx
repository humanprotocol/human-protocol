import { Grid, Paper, Stack, Typography } from '@mui/material';
import { t } from 'i18next';
import { Chips } from '@/components/ui/chips';
import { TableButton } from '@/components/ui/table-button';
import { Loader } from '@/components/ui/loader';
import type { OraclesDataQueryResult } from '@/pages/worker/jobs-discovery/jobs-discovery.page';
import { EvmAddress } from '@/pages/worker/jobs/components/evm-address';
import { ListItem } from '@/components/ui/list-item';
import { useColorMode } from '@/hooks/use-color-mode';
import type { JobType } from '@/smart-contracts/EthKVStore/config';
import type { OracleSuccessResponse } from '@/api/services/worker/oracles';
import { NoRecords } from '@/components/ui/no-records';

export function OraclesTableMobile({
  selectOracle,
  oraclesQueryDataResult: {
    data: oraclesData,
    isError: isOraclesDataError,
    isPending: isOraclesDataPending,
  },
}: {
  selectOracle: (oracle: OracleSuccessResponse, jobTypes: string[]) => void;
  oraclesQueryDataResult: OraclesDataQueryResult;
}) {
  const { colorPalette } = useColorMode();

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
    return <NoRecords />;
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
              <Typography variant="body2">{d.url ?? ''}</Typography>
            </ListItem>
            <ListItem label={t('worker.oraclesTable.jobTypes')}>
              <Chips
                data={d.jobTypes.map((jobType) =>
                  t(`jobTypeLabels.${jobType as JobType}`)
                )}
              />
            </ListItem>
          </Grid>
          <TableButton
            fullWidth
            onClick={() => {
              selectOracle(d, d.jobTypes);
            }}
          >
            {t('worker.oraclesTable.seeJobs')}
          </TableButton>
        </Paper>
      ))}
    </Stack>
  );
}
