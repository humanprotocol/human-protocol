/* eslint-disable camelcase -- ... */
import { Grid, List, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Alert } from '@/shared/components/ui/alert';
import { getNetworkName } from '@/modules/smart-contracts/get-network-name';
import { Loader } from '@/shared/components/ui/loader';
import { Chip } from '@/shared/components/ui/chip';
import { ListItem } from '@/shared/components/ui/list-item';
import { type JobType } from '@/modules/smart-contracts/EthKVStore/config';
import { useColorMode } from '@/shared/contexts/color-mode';
import { getErrorMessageForError } from '@/shared/errors';
import { useCombinePages, useJobsFilterStore } from '../../../hooks';
import {
  useInifiniteGetAvailableJobsData,
  type AvailableJob,
} from '../../hooks/use-get-available-jobs-data';
import { EvmAddress, RewardAmount } from '../../../components';
import { AvailableJobsAssignJobButtonMobile } from './available-jobs-assign-job-button-mobile';

export function AvailableJobsTableJobsListMobile() {
  const { t } = useTranslation();
  const { colorPalette } = useColorMode();
  const { filterParams, setPageParams, resetFilterParams } =
    useJobsFilterStore();
  const {
    data: tableData,
    status: tableStatus,
    isError: isTableError,
    error: tableError,
    fetchNextPage,
    hasNextPage,
  } = useInifiniteGetAvailableJobsData();

  const allPages = useCombinePages<AvailableJob>(tableData, filterParams.page);

  useEffect(() => {
    return () => {
      resetFilterParams();
    };
  }, [resetFilterParams]);

  return (
    <Stack flexDirection="column">
      {isTableError && (
        <Alert color="error" severity="error">
          {getErrorMessageForError(tableError)}
        </Alert>
      )}
      {tableStatus === 'pending' && (
        <Stack alignItems="center" justifyContent="center">
          <Loader size={90} />
        </Stack>
      )}

      {allPages.map((d) => (
        <Paper
          key={`${d.escrow_address}-${d.chain_id}-${d.job_type}`}
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
