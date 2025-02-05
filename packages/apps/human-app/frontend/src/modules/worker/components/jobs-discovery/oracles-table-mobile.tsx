import { Grid, Paper, Stack, Typography } from '@mui/material';
import { t } from 'i18next';
import { Chips } from '@/shared/components/ui/chips';
import { TableButton } from '@/shared/components/ui/table-button';
import { Loader } from '@/shared/components/ui/loader';
import type { OraclesDataQueryResult } from '@/modules/worker/views/jobs-discovery/jobs-discovery.page';
import { EvmAddress } from '@/modules/worker/components/jobs/evm-address';
import { ListItem } from '@/shared/components/ui/list-item';
import { useColorMode } from '@/shared/contexts/color-mode';
import type { JobType } from '@/modules/smart-contracts/EthKVStore/config';
import type { Oracle } from '@/modules/worker/services/oracles';
import { NoRecords } from '@/shared/components/ui/no-records';

export function OraclesTableMobile({
  selectOracle,
  oraclesQueryDataResult: {
    data: oraclesData,
    isError: isOraclesDataError,
    isPending: isOraclesDataPending,
  },
}: {
  selectOracle: (oracle: Oracle, jobTypes: string[]) => void;
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
              <Typography variant="body2">{d.name}</Typography>
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
