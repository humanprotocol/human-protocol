import { Grid, List, Paper, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Dispatch, SetStateAction } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ProfileListItem } from '@/pages/operator/profile/profile-list-item';
import { colorPalette } from '@/styles/color-palette';
import { Button } from '@/components/ui/button';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { FiltersButtonIcon } from '@/components/ui/icons';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import { Loader } from '@/components/ui/loader';
import { Alert } from '@/components/ui/alert';
import { parseNetworkName } from '@/shared/helpers/parse-network-label';
import { shortenEscrowAddress } from '@/shared/helpers/shorten-escrow-address';
import type { AvailableJobsSuccessResponse } from '@/api/servieces/worker/available-jobs-data';

interface AvailableJobsTableMobileProps {
  setIsMobileFilterDrawerOpen: Dispatch<SetStateAction<boolean>>;
}

export function AvailableJobsTableMobile({
  setIsMobileFilterDrawerOpen,
}: AvailableJobsTableMobileProps) {
  const { filterParams } = useJobsFilterStore();
  const queryClient = useQueryClient();
  const availableJobsTableState = queryClient.getQueryState([
    'availableJobs',
    filterParams,
  ]);
  const queryData = queryClient.getQueryData<AvailableJobsSuccessResponse>([
    'availableJobs',
    filterParams,
  ]);
  const { t } = useTranslation();

  const { setSearchEscrowAddress } = useJobsFilterStore();

  return (
    <>
      <SearchForm
        columnId={t('worker.jobs.escrowAddressColumnId')}
        fullWidth
        label={t('worker.jobs.searchEscrowAddress')}
        name={t('worker.jobs.searchEscrowAddress')}
        placeholder={t('worker.jobs.searchEscrowAddress')}
        updater={setSearchEscrowAddress}
      />
      <Button
        fullWidth
        onClick={() => {
          setIsMobileFilterDrawerOpen(true);
        }}
        sx={{
          marginBottom: '32px',
          marginTop: '21px',
        }}
        variant="outlined"
      >
        {t('worker.jobs.mobileFilterDrawer.filters')}
        <FiltersButtonIcon />
      </Button>
      <Stack flexDirection="column">
        {availableJobsTableState?.status === 'error' ? (
          <Alert color="error" severity="error">
            {t('worker.jobs.errorFetchingData')}
          </Alert>
        ) : null}
        {availableJobsTableState?.status === 'pending' &&
        !availableJobsTableState.error ? (
          <Stack alignItems="center" justifyContent="center">
            <Loader size={90} />
          </Stack>
        ) : null}
        {availableJobsTableState?.status === 'success' &&
        !availableJobsTableState.error &&
        queryData?.results
          ? queryData.results.map((d) => (
              <Paper
                key={crypto.randomUUID()}
                sx={{
                  px: '16px',
                  py: '32px',
                  backgroundColor: colorPalette.white,
                  marginBottom: '20px',
                }}
              >
                <List>
                  <Grid container>
                    <Grid item xs={6}>
                      <ProfileListItem
                        header={t('worker.jobs.escrowAddress')}
                        paragraph={shortenEscrowAddress(d.escrow_address)}
                      />
                      <ProfileListItem
                        header={t('worker.jobs.jobType')}
                        paragraph={d.job_type}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <ProfileListItem
                        header={t('worker.jobs.network')}
                        paragraph={parseNetworkName(d.chain_id)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        color="secondary"
                        fullWidth
                        size="small"
                        sx={{
                          marginTop: '15px',
                        }}
                        type="button"
                        variant="contained"
                      >
                        {t('worker.jobs.selectJob')}
                      </Button>
                    </Grid>
                  </Grid>
                </List>
              </Paper>
            ))
          : null}
      </Stack>
    </>
  );
}
