/* eslint-disable camelcase -- ... */
import { Grid, List, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FiltersButtonIcon, RefreshIcon } from '@/components/ui/icons';
import { formatDate } from '@/shared/helpers/format-date';
import { Loader } from '@/components/ui/loader';
import { Alert } from '@/components/ui/alert';
import { getNetworkName } from '@/smart-contracts/get-network-name';
import { TableButton } from '@/components/ui/table-button';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import { RejectButton } from '@/pages/worker/jobs/components/reject-button';
import { useRejectTaskMutation } from '@/api/services/worker/reject-task';
import type { MyJob } from '@/api/services/worker/my-jobs-data';
import { useInfiniteGetMyJobsData } from '@/api/services/worker/my-jobs-data';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { useMyJobsFilterStore } from '@/hooks/use-my-jobs-filter-store';
import { ListItem } from '@/components/ui/list-item';
import { EvmAddress } from '@/pages/worker/jobs/components/evm-address';
import { RewardAmount } from '@/pages/worker/jobs/components/reward-amount';
import { useColorMode } from '@/hooks/use-color-mode';
import { Chip } from '@/components/ui/chip';
import type { JobType } from '@/smart-contracts/EthKVStore/config';
import { EscrowAddressSearchForm } from '@/pages/worker/jobs/components/escrow-address-search-form';
import { colorPalette as lightModeColorPalette } from '@/styles/color-palette';
import { useRefreshTasksMutation } from '@/api/services/worker/refresh-tasks';
import { type ChainIdsEnabled } from '@/api/services/worker/oracles';

interface MyJobsTableMobileProps {
  setIsMobileFilterDrawerOpen: Dispatch<SetStateAction<boolean>>;
  chainIdsEnabled: ChainIdsEnabled;
}

export function MyJobsTableMobile({
  setIsMobileFilterDrawerOpen,
  chainIdsEnabled,
}: MyJobsTableMobileProps) {
  const { colorPalette } = useColorMode();
  const [allPages, setAllPages] = useState<MyJob[]>([]);
  const { filterParams, setPageParams, resetFilterParams } =
    useMyJobsFilterStore();

  const { t } = useTranslation();
  const {
    data: tableData,
    status: tableStatus,
    isError: isTableError,
    error: tableError,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteGetMyJobsData();

  const { mutate: rejectTaskMutation } = useRejectTaskMutation();
  const { mutate: refreshTasksMutation, isPending: isRefreshTasksPending } =
    useRefreshTasksMutation();
  const { setSearchEscrowAddress } = useJobsFilterStore();
  const { address: oracle_address } = useParams<{ address: string }>();

  useEffect(() => {
    if (!tableData) return;
    const pagesFromRes = tableData.pages.flatMap((pages) => pages.results);
    if (filterParams.page === 0) {
      setAllPages(pagesFromRes);
    } else {
      setAllPages((state) => [...state, ...pagesFromRes]);
    }
  }, [tableData, filterParams.page]);

  useEffect(() => {
    return () => {
      resetFilterParams();
    };
  }, [resetFilterParams]);

  return (
    <>
      <EscrowAddressSearchForm
        columnId={t('worker.jobs.escrowAddressColumnId')}
        fullWidth
        label={t('worker.jobs.searchEscrowAddress')}
        placeholder={t('worker.jobs.searchEscrowAddress')}
        updater={setSearchEscrowAddress}
      />
      <Grid container spacing={2}>
        <Grid item xs={6}>
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
        </Grid>
        <Grid item xs={6}>
          <Button
            fullWidth
            size="small"
            sx={{
              marginBottom: '32px',
              marginTop: '21px',
            }}
            type="button"
            variant="outlined"
            loading={isRefreshTasksPending}
            onClick={() => {
              refreshTasksMutation({
                oracle_address: oracle_address ?? '',
              });
            }}
          >
            {t('worker.jobs.refresh')}
            <RefreshIcon />
          </Button>
        </Grid>
      </Grid>

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
        {allPages.map((d) => {
          const buttonDisabled = d.status !== 'active';
          return (
            <Paper
              key={crypto.randomUUID()}
              sx={{
                px: '16px',
                py: '32px',
                marginBottom: '20px',
                boxShadow: 'none',
                borderRadius: '20px',
              }}
            >
              <List>
                <Grid container>
                  <Grid item xs={6}>
                    <ListItem label={t('worker.jobs.escrowAddress')}>
                      <EvmAddress address={d.escrow_address} />
                    </ListItem>
                    <ListItem label={t('worker.jobs.expiresAt')}>
                      <Typography variant="body2">
                        {d.expires_at ? formatDate(d.expires_at) : ''}
                      </Typography>
                    </ListItem>
                    <ListItem label={t('worker.jobs.rewardAmount')}>
                      <RewardAmount
                        color={colorPalette.primary.light}
                        reward_amount={d.reward_amount}
                        reward_token={d.reward_token}
                      />
                    </ListItem>
                  </Grid>
                  <Grid item xs={6}>
                    <ListItem label={t('worker.jobs.network')}>
                      <Typography
                        color={colorPalette.primary.light}
                        variant="body2"
                      >
                        {getNetworkName(chainIdsEnabled, d.chain_id)}
                      </Typography>
                    </ListItem>
                    <ListItem label={t('worker.jobs.status')}>
                      <Chip
                        backgroundColor={colorPalette.secondary.main}
                        label={
                          <Typography
                            color={lightModeColorPalette.white}
                            variant="chip"
                          >
                            {d.status}
                          </Typography>
                        }
                      />
                    </ListItem>
                    <ListItem label={t('worker.jobs.jobType')}>
                      <Chip
                        label={t(`jobTypeLabels.${d.job_type as JobType}`)}
                      />
                    </ListItem>
                  </Grid>
                  <Grid
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '1rem',
                      width: '100%',
                    }}
                  >
                    {d.url ? (
                      <>
                        <TableButton
                          component={Link}
                          disabled={buttonDisabled}
                          fullWidth
                          target="_blank"
                          to={d.url}
                        >
                          {t('worker.jobs.solve')}
                        </TableButton>
                        <RejectButton
                          disabled={buttonDisabled}
                          onClick={() => {
                            if (buttonDisabled) return;
                            rejectTaskMutation({
                              oracle_address: oracle_address ?? '',
                              assignment_id: d.assignment_id,
                            });
                          }}
                        />
                      </>
                    ) : null}
                  </Grid>
                </Grid>
              </List>
            </Paper>
          );
        })}
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
