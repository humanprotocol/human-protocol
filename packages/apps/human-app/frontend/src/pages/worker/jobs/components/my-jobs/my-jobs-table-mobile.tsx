import { Grid, List, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Dispatch, SetStateAction } from 'react';
import { ProfileListItem } from '@/pages/operator/profile/profile-list-item';
import { colorPalette } from '@/styles/color-palette';
import { Button } from '@/components/ui/button';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { FiltersButtonIcon } from '@/components/ui/icons';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import { Chip } from '@/components/ui/chip';
import { formatDate } from '@/shared/helpers/format-date';
import { Loader } from '@/components/ui/loader';
import { Alert } from '@/components/ui/alert';
import { parseNetworkName } from '@/shared/helpers/parse-network-label';
import { shortenEscrowAddress } from '@/shared/helpers/shorten-escrow-address';
import type { MyJobs } from '@/api/servieces/worker/my-jobs-table-service-mock';
import { parseJobStatusChipColor } from './parse-job-status-chip-color';
import { MyJobsButton } from './my-jobs-button';

interface MyJobsTableMobileProps {
  data?: MyJobs;
  isLoading: boolean;
  isError: boolean;
  setIsMobileFilterDrawerOpen: Dispatch<SetStateAction<boolean>>;
}

export function MyJobsTableMobile({
  data,
  isLoading,
  isError,
  setIsMobileFilterDrawerOpen,
}: MyJobsTableMobileProps) {
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
                        header={t('worker.jobs.expiresAt')}
                        paragraph={d.expires_at ? formatDate(d.expires_at) : ''}
                      />
                      <ProfileListItem
                        header={t('worker.jobs.rewardAmount')}
                        paragraph={`${d.reward_amount}`}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <ProfileListItem
                        header={t('worker.jobs.network')}
                        paragraph={parseNetworkName(d.chain_id)}
                      />
                      <Typography
                        component="div"
                        sx={{
                          marginTop: '15px',
                        }}
                        variant="subtitle2"
                      >
                        {t('worker.jobs.status')}
                      </Typography>
                      <Stack
                        alignItems="center"
                        direction="row"
                        sx={{
                          marginBottom: '25px',
                        }}
                      >
                        <Chip
                          backgroundColor={parseJobStatusChipColor(d.status)}
                          key={d.status}
                          label={d.status}
                        />
                      </Stack>
                      <ProfileListItem
                        header={t('worker.jobs.jobType')}
                        paragraph={[d.job_type]}
                      />
                    </Grid>
                    <Stack
                      sx={{
                        width: '100%',
                      }}
                    >
                      <MyJobsButton status={d.status} />
                    </Stack>
                  </Grid>
                </List>
              </Paper>
            ))
          : null}
      </Stack>
    </>
  );
}
