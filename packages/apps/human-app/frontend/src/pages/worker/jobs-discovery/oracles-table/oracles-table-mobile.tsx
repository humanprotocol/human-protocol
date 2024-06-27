import { Grid, Paper, Stack, Typography } from '@mui/material';
import { t } from 'i18next';
import { ProfileListItem } from '@/components/ui/profile-list-item';
import { colorPalette } from '@/styles/color-palette';
import { shortenEscrowAddress } from '@/shared/helpers/shorten-escrow-address';
import { Chips } from '@/components/ui/chips';
import { TableButton } from '@/components/ui/table-button';
import { Loader } from '@/components/ui/loader';
import { Alert } from '@/components/ui/alert';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import type { OraclesDataQueryResult } from '@/pages/worker/jobs-discovery/jobs-discovery.page';

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
          }}
        >
          <Grid item xs={6}>
            <ProfileListItem
              header={t('worker.oraclesTable.oracleAddress')}
              paragraph={shortenEscrowAddress(d.address)}
            />
            <ProfileListItem
              header={t('worker.oraclesTable.annotationTool')}
              paragraph={d.url || ''}
            />
            <Typography
              component="div"
              sx={{
                marginTop: '15px',
              }}
              variant="subtitle2"
            >
              {t('worker.oraclesTable.jobTypes')}
            </Typography>
            <Stack
              alignItems="center"
              direction="row"
              sx={{
                marginBottom: '25px',
              }}
            >
              <Chips data={d.jobTypes} />
            </Stack>
            <TableButton
              onClick={() => {
                selectOracle(d.address, d.jobTypes);
              }}
            >
              {t('worker.oraclesTable.seeJobs')}
            </TableButton>
          </Grid>
        </Paper>
      ))}
    </Stack>
  );
}
