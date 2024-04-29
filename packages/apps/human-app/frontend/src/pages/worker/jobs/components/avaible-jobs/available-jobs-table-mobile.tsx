import { Grid, List, Paper, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { ProfileListItem } from '@/pages/operator/components/profile/profile-list-item';
import { colorPalette } from '@/styles/color-palette';
import { Button } from '@/components/ui/button';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { FiltersButtonIcon } from '@/components/ui/icons';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import { Loader } from '@/components/ui/loader';
import { Alert } from '@/components/ui/alert';
import type { AvailableJobs } from '@/api/servieces/worker/available-jobs-data';
import { shortenEscrowAddress } from '../utils/shorten-escrow-address';
import { parseNetworkName } from '../utils/parse-network-label';

interface AvailableJobsTableMobileProps {
  data?: AvailableJobs;
  isLoading: boolean;
  isError: boolean;
}

export function AvailableJobsTableMobile({
  data,
  isLoading,
  isError,
}: AvailableJobsTableMobileProps) {
  const { t } = useTranslation();

  const { setMobileFilterDrawer, setSearchEscrowAddress, resetFilterParams } =
    useJobsFilterStore();

  useEffect(() => {
    return () => {
      resetFilterParams();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only on unmount
  }, []);
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
          setMobileFilterDrawer(true);
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
        {isError ? (
          <Alert color="error" severity="error">
            {t('worker.jobs.errorFetchingData')}
          </Alert>
        ) : null}
        {isLoading && !isError ? (
          <Stack alignItems="center" justifyContent="center">
            <Loader size={90} />
          </Stack>
        ) : null}
        {!isLoading && !isError && data
          ? data.results.map((d) => (
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
