import { Grid, List, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProfileListItem } from '@/pages/operator/components/profile/profile-list-item';
import { colorPalette } from '@/styles/color-palette';
import { Button } from '@/components/ui/button';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { FiltersButtonIcon } from '@/components/ui/icons';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import { Chip } from '@/components/ui/chip';
import { parseJobStatusChipColor } from '@/shared/utils/parse-chip-color';
import { formatDate } from '@/shared/utils/format-date';
import { shortenEscrowAddress } from '../utils/shorten-escrow-address';
import { parseNetworkName } from '../utils/parse-network-label';
import { getJobsTableData, type MyJobs } from './my-jobs-table-service';
import { MyJobsButton } from './my-jobs-button';

export function MyJobsTableMobile() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery<MyJobs>({
    queryKey: ['example', []],
    queryFn: () => getJobsTableData(),
  });
  const { setMobileFilterDrawer, setSearchEscrowAddress, setFilterParams } =
    useJobsFilterStore();

  useEffect(() => {
    setFilterParams({});
  }, [setFilterParams]);

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
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          data?.results.map((d) => (
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
        )}
      </Stack>
    </>
  );
}
