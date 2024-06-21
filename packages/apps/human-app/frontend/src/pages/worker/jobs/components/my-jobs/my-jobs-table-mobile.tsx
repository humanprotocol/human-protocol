/* eslint-disable camelcase -- ... */
import { Grid, List, Paper, Stack, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Link } from 'react-router-dom';
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
import { TableButton } from '@/components/ui/table-button';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import { RejectButton } from '@/pages/worker/jobs/components/reject-button';
import { useRejectTaskMutation } from '@/api/servieces/worker/reject-task';
import type { MyJob } from '@/api/servieces/worker/my-jobs-data';
import { useInfiniteGetMyJobsData } from '@/api/servieces/worker/my-jobs-data';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { useMyJobsFilterStore } from '@/hooks/use-my-jobs-filter-store';
import { parseJobStatusChipColor } from './parse-job-status-chip-color';

interface MyJobsTableMobileProps {
  setIsMobileFilterDrawerOpen: Dispatch<SetStateAction<boolean>>;
}

export function MyJobsTableMobile({
  setIsMobileFilterDrawerOpen,
}: MyJobsTableMobileProps) {
  const [allPages, setAllPages] = useState<MyJob[]>([]);
  const { filterParams, setFilterParams } = useMyJobsFilterStore();

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
  const {
    filterParams: { oracle_address },
    setSearchEscrowAddress,
  } = useJobsFilterStore();

  useEffect(() => {
    if (!tableData) return;
    const pagesFromRes = tableData.pages.flatMap((pages) => pages.results);
    setAllPages((state) => [...state, ...pagesFromRes]);
  }, [tableData]);

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
        {allPages.map((d) => {
          const buttonDisabled = d.status !== 'ACTIVE';
          return (
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
                  <Grid
                    sx={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: '1rem',
                      width: '100%',
                    }}
                  >
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
                          address: oracle_address || '',
                          assignment_id: d.assignment_id,
                        });
                      }}
                    />
                  </Grid>
                </Grid>
              </List>
            </Paper>
          );
        })}
        {hasNextPage ? (
          <Button
            onClick={() => {
              setFilterParams({
                ...filterParams,
                page: filterParams.page + 1,
              });
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
