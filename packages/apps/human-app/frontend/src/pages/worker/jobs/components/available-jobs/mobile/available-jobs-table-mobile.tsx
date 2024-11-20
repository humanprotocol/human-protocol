/* eslint-disable camelcase -- ... */
import { Grid, List, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { FiltersButtonIcon } from '@/components/ui/icons';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import { Alert } from '@/components/ui/alert';
import { getNetworkName } from '@/smart-contracts/get-network-name';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import type { AvailableJob } from '@/api/services/worker/available-jobs-data';
import { useInfiniteGetAvailableJobsData } from '@/api/services/worker/available-jobs-data';
import { Loader } from '@/components/ui/loader';
import { EvmAddress } from '@/pages/worker/jobs/components/evm-address';
import { Chip } from '@/components/ui/chip';
import { RewardAmount } from '@/pages/worker/jobs/components/reward-amount';
import { ListItem } from '@/components/ui/list-item';
import { useColorMode } from '@/hooks/use-color-mode';
import type { JobType } from '@/smart-contracts/EthKVStore/config';
import { EscrowAddressSearchForm } from '@/pages/worker/jobs/components/escrow-address-search-form';
import { AvailableJobsAssignJobButton } from '@/pages/worker/jobs/components/available-jobs/mobile/available-jobs-assign-job-button';
import { type ChainIdsEnabled } from '@/api/services/worker/oracles';

interface AvailableJobsTableMobileProps {
  setIsMobileFilterDrawerOpen: Dispatch<SetStateAction<boolean>>;
  chainIdsEnabled: ChainIdsEnabled;
}

export function AvailableJobsTableMobile({
  setIsMobileFilterDrawerOpen,
  chainIdsEnabled,
}: AvailableJobsTableMobileProps) {
  const { colorPalette } = useColorMode();
  const [allPages, setAllPages] = useState<AvailableJob[]>([]);

  const {
    data: tableData,
    status: tableStatus,
    isError: isTableError,
    error: tableError,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteGetAvailableJobsData();
  const { filterParams, setPageParams, resetFilterParams } =
    useJobsFilterStore();
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
              marginBottom: '20px',
              borderRadius: '20px',
              boxShadow: 'unset',
            }}
          >
            <List>
              <Grid columnSpacing="2rem" container>
                <Grid item xs={12}>
                  <ListItem label={t('worker.jobs.jobDescription')}>
                    <Typography
                      sx={{
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'wrap',
                      }}
                      variant="subtitle1"
                    >
                      {d.job_description}
                    </Typography>
                  </ListItem>
                </Grid>
                <Grid item xs={6}>
                  <ListItem label={t('worker.jobs.escrowAddress')}>
                    <EvmAddress address={d.escrow_address} />
                  </ListItem>
                  <ListItem label={t('worker.jobs.rewardAmount')}>
                    <RewardAmount
                      color={colorPalette.secondary.light}
                      reward_amount={d.reward_amount}
                      reward_token={d.reward_token}
                    />
                  </ListItem>
                </Grid>
                <Grid item xs={6}>
                  <ListItem label={t('worker.jobs.network')}>
                    <Typography
                      color={colorPalette.secondary.light}
                      variant="body2"
                    >
                      {getNetworkName(chainIdsEnabled, d.chain_id)}
                    </Typography>
                  </ListItem>
                </Grid>
                <Grid item xs={12}>
                  <ListItem label={t('worker.jobs.jobType')}>
                    <Chip label={t(`jobTypeLabels.${d.job_type as JobType}`)} />
                  </ListItem>
                </Grid>
                <Grid item xs={12}>
                  <AvailableJobsAssignJobButton
                    assignJobPayload={{
                      escrow_address: d.escrow_address,
                      chain_id: d.chain_id,
                    }}
                  />
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
