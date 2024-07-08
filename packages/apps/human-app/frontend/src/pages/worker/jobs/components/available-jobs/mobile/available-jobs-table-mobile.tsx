/* eslint-disable camelcase -- ... */
import { Grid, List, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { colorPalette } from '@/styles/color-palette';
import { Button } from '@/components/ui/button';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { FiltersButtonIcon } from '@/components/ui/icons';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import { Alert } from '@/components/ui/alert';
import { getNetworkName } from '@/smart-contracts/get-network-name';
import { useAssignJobMutation } from '@/api/servieces/worker/assign-job';
import { useJobsNotifications } from '@/hooks/use-jobs-notifications';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import type { AvailableJob } from '@/api/servieces/worker/available-jobs-data';
import { useInfiniteGetAvailableJobsData } from '@/api/servieces/worker/available-jobs-data';
import { Loader } from '@/components/ui/loader';
import { TableButton } from '@/components/ui/table-button';
import { EvmAddress } from '@/pages/worker/jobs/components/evm-address';
import { Chip } from '@/components/ui/chip';
import { RewardAmount } from '@/pages/worker/jobs/components/reward-amount';
import { ListItem } from '@/components/ui/list-item';

interface AvailableJobsTableMobileProps {
  setIsMobileFilterDrawerOpen: Dispatch<SetStateAction<boolean>>;
}

export function AvailableJobsTableMobile({
  setIsMobileFilterDrawerOpen,
}: AvailableJobsTableMobileProps) {
  const [allPages, setAllPages] = useState<AvailableJob[]>([]);
  const { onJobAssignmentError, onJobAssignmentSuccess } =
    useJobsNotifications();

  const { mutate: assignJobMutation } = useAssignJobMutation({
    onSuccess: onJobAssignmentSuccess,
    onError: onJobAssignmentError,
  });

  const {
    data: tableData,
    status: tableStatus,
    isError: isTableError,
    error: tableError,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteGetAvailableJobsData();
  const { filterParams, setPageParams } = useJobsFilterStore();
  const { t } = useTranslation();
  const { setSearchEscrowAddress } = useJobsFilterStore();

  useEffect(() => {
    if (!tableData) return;
    const pagesFromRes = tableData.pages.flatMap((pages) => pages.results);
    if (filterParams.page === 0) {
      setAllPages(pagesFromRes);
    } else {
      setAllPages((state) => [...state, ...pagesFromRes]);
    }
  }, [tableData, filterParams.page]);

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
        {isTableError ? (
          <Alert color="error" severity="error">
            {defaultErrorMessage(tableError)}
          </Alert>
        ) : null}
        {tableStatus === 'pending' ? (
          <Stack alignItems="center" justifyContent="center">
            <Loader size={90} />
          </Stack>
        ) : null}
        {allPages.map((d) => (
          <Paper
            key={crypto.randomUUID()}
            sx={{
              px: '16px',
              py: '32px',
              backgroundColor: colorPalette.white,
              marginBottom: '20px',
              borderRadius: '20px',
              boxShadow: 'unset',
            }}
          >
            <List>
              <Grid container>
                <Grid item xs={12}>
                  <ListItem label={t('worker.jobs.jobDescription')}>
                    <Typography variant="subtitle1">
                      {d.job_description}
                    </Typography>
                  </ListItem>
                </Grid>
                <Grid item xs={6}>
                  <ListItem label={t('worker.jobs.escrowAddress')}>
                    <EvmAddress address={d.escrow_address} />
                  </ListItem>
                  <ListItem label={t('worker.jobs.rewardAmount')}>
                    <Typography
                      color={colorPalette.secondary.light}
                      variant="body2"
                    >
                      <RewardAmount
                        color={colorPalette.secondary.light}
                        reward_amount={d.reward_amount}
                        reward_token={d.reward_token}
                      />
                    </Typography>
                  </ListItem>
                </Grid>
                <Grid item xs={6}>
                  <ListItem label={t('worker.jobs.network')}>
                    <Typography
                      color={colorPalette.secondary.light}
                      variant="body2"
                    >
                      {getNetworkName(d.chain_id)}
                    </Typography>
                  </ListItem>
                  <ListItem label={t('worker.jobs.jobType')}>
                    <Chip label={d.job_type} />
                  </ListItem>
                </Grid>
                <Grid item xs={12}>
                  <TableButton
                    color="secondary"
                    fullWidth
                    onClick={() => {
                      assignJobMutation({
                        escrow_address: d.escrow_address,
                        chain_id: d.chain_id,
                      });
                    }}
                    size="small"
                    sx={{
                      marginTop: '15px',
                    }}
                    type="button"
                    variant="contained"
                  >
                    {t('worker.jobs.selectJob')}
                  </TableButton>
                </Grid>
              </Grid>
            </List>
          </Paper>
        ))}
        {hasNextPage ? (
          <Button
            onClick={() => {
              setPageParams(filterParams.page + 1, filterParams.page_size);
              void fetchNextPage();
            }}
            variant="outlined"
          >
            {t('worker.jobs.next')}
          </Button>
        ) : null}
      </Stack>
    </>
  );
}
