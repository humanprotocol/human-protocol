import { Grid, List, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Dispatch, SetStateAction } from 'react';
import { ProfileListItem } from '@/components/ui/profile-list-item';
import { colorPalette } from '@/styles/color-palette';
import { Button } from '@/components/ui/button';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { FiltersButtonIcon } from '@/components/ui/icons';
import { Chip } from '@/components/ui/chip';
import { formatDate } from '@/shared/helpers/format-date';
import { Loader } from '@/components/ui/loader';
import { Alert } from '@/components/ui/alert';
import { shortenEscrowAddress } from '@/shared/helpers/shorten-escrow-address';
import { getNetworkName } from '@/smart-contracts/get-network-name';
import { useMyJobsFilterStore } from '@/hooks/use-my-jobs-filter-store';
import { useMyJobsTableState } from '@/hooks/use-my-jobs-table-state';
import { parseJobStatusChipColor } from './parse-job-status-chip-color';
import { MyJobsButton } from './my-jobs-button';

interface MyJobsTableMobileProps {
  setIsMobileFilterDrawerOpen: Dispatch<SetStateAction<boolean>>;
}

export function MyJobsTableMobile({
  setIsMobileFilterDrawerOpen,
}: MyJobsTableMobileProps) {
  const { t } = useTranslation();
  const { setSearchEscrowAddress } = useMyJobsFilterStore();
  const { myJobsTableState, myJobsTableQueryData } = useMyJobsTableState();

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
        {myJobsTableState?.status === 'error' ? (
          <Alert color="error" severity="error">
            {t('worker.jobs.errorFetchingData')}
          </Alert>
        ) : null}
        {myJobsTableState?.status === 'pending' && !myJobsTableState.error ? (
          <Stack alignItems="center" justifyContent="center">
            <Loader size={90} />
          </Stack>
        ) : null}
        {myJobsTableState?.status === 'success'
          ? myJobsTableQueryData.map((d) => (
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
                        paragraph={`${d.reward_amount.toFixed(0)} ${d.reward_token}`}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <ProfileListItem
                        header={t('worker.jobs.network')}
                        paragraph={getNetworkName(d.chain_id)}
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
