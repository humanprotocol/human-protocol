/* eslint-disable camelcase -- ... */
import { Grid, List, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { FiltersButtonIcon, RefreshIcon } from '@/shared/components/ui/icons';
import { Loader } from '@/shared/components/ui/loader';
import { Alert } from '@/shared/components/ui/alert';
import { getNetworkName } from '@/modules/smart-contracts/get-network-name';
import { useJobsFilterStore } from '@/modules/worker/hooks/use-jobs-filter-store';
import type { MyJob } from '@/modules/worker/services/my-jobs-data';
import { useInfiniteGetMyJobsData } from '@/modules/worker/services/my-jobs-data';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { useMyJobsFilterStore } from '@/modules/worker/hooks/use-my-jobs-filter-store';
import { ListItem } from '@/shared/components/ui/list-item';
import { EvmAddress } from '@/modules/worker/components/jobs/evm-address';
import { RewardAmount } from '@/modules/worker/components/jobs/reward-amount';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { Chip } from '@/shared/components/ui/chip';
import type { JobType } from '@/modules/smart-contracts/EthKVStore/config';
import { EscrowAddressSearchForm } from '@/modules/worker/components/jobs/escrow-address-search-form';
import { colorPalette as lightModeColorPalette } from '@/shared/styles/color-palette';
import { useRefreshTasksMutation } from '@/modules/worker/services/refresh-tasks';
import { getChipStatusColor } from '@/modules/worker/utils/get-chip-status-color';
import { formatDate } from '@/shared/helpers/date';
import { MyJobsTableActions } from '../../my-jobs-table-actions';

interface MyJobsTableMobileProps {
  setIsMobileFilterDrawerOpen: Dispatch<SetStateAction<boolean>>;
}

export function MyJobsTableMobile({
  setIsMobileFilterDrawerOpen,
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
                        {getNetworkName(d.chain_id)}
                      </Typography>
                    </ListItem>
                    <ListItem label={t('worker.jobs.status')}>
                      <Chip
                        backgroundColor={getChipStatusColor(
                          d.status,
                          colorPalette
                        )}
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
                    <MyJobsTableActions job={d} />
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
