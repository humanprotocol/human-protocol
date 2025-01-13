/* eslint-disable camelcase -- ... */
import { Grid, List, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { useJobsFilterStore } from '@/modules/worker/hooks/use-jobs-filter-store';
import { Alert } from '@/shared/components/ui/alert';
import { getNetworkName } from '@/modules/smart-contracts/get-network-name';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import type { AvailableJob } from '@/modules/worker/services/available-jobs-data';
import { useInfiniteGetAvailableJobsData } from '@/modules/worker/services/available-jobs-data';
import { Loader } from '@/shared/components/ui/loader';
import { EvmAddress } from '@/modules/worker/components/jobs/evm-address';
import { Chip } from '@/shared/components/ui/chip';
import { RewardAmount } from '@/modules/worker/components/jobs/reward-amount';
import { ListItem } from '@/shared/components/ui/list-item';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { AvailableJobsAssignJobButtonMobile } from '@/modules/worker/components/jobs/available-jobs/components/mobile/available-jobs-assign-job-button-mobile';
import { type JobType } from '@/modules/smart-contracts/EthKVStore/config';

export function AvailableJobsTableJobsListMobile() {
  const { t } = useTranslation();
  const { colorPalette } = useColorMode();
  const [allPages, setAllPages] = useState<AvailableJob[]>([]);
  const { filterParams, setPageParams, resetFilterParams } =
    useJobsFilterStore();
  const {
    data: tableData,
    status: tableStatus,
    isError: isTableError,
    error: tableError,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteGetAvailableJobsData();

  useEffect(() => {
    if (!tableData) return;
    const pagesFromRes = tableData.pages.flatMap((pages) => pages.results);

    setAllPages((state) =>
      filterParams.page === 0 ? pagesFromRes : [...state, ...pagesFromRes]
    );
  }, [tableData, filterParams.page]);

  useEffect(() => {
    return () => {
      resetFilterParams();
    };
  }, [resetFilterParams]);

  return (
    <Stack flexDirection="column">
      {isTableError && (
        <Alert color="error" severity="error">
          {defaultErrorMessage(tableError)}
        </Alert>
      )}
      {tableStatus === 'pending' && (
        <Stack alignItems="center" justifyContent="center">
          <Loader size={90} />
        </Stack>
      )}

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
                    {getNetworkName(d.chain_id)}
                  </Typography>
                </ListItem>
              </Grid>
              <Grid item xs={12}>
                <ListItem label={t('worker.jobs.jobType')}>
                  <Chip label={t(`jobTypeLabels.${d.job_type as JobType}`)} />
                </ListItem>
              </Grid>
              <Grid item xs={12}>
                <AvailableJobsAssignJobButtonMobile
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
  );
}
