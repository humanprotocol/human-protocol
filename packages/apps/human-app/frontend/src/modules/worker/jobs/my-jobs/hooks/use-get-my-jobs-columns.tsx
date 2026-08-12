import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Chip, Grid, Typography } from '@mui/material';
import { type MRT_ColumnDef } from 'material-react-table';

import type { JobType } from '@/shared/types/entity.type';
import { EvmAddress, RewardAmount, MyJobsTableActions } from '../../components';
import { type MyJob } from '../../schemas';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { ChainIcon } from '@/shared/components/ui/chain-icon';
import { TimeUntil } from '../components/time-until';

const COL_SIZE_SM = 50;
const COL_SIZE = 100;
const COL_SIZE_MD = 150;

export const useGetMyJobsColumns = (): MRT_ColumnDef<MyJob>[] => {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        accessorKey: 'escrow_address',
        header: t('worker.jobs.address'),
        size: COL_SIZE,
        enableSorting: true,
        Cell: (props) => {
          return <EvmAddress address={props.row.original.escrow_address} />;
        },
      },
      {
        accessorKey: 'network',
        header: t('worker.jobs.network'),
        size: COL_SIZE_SM,
        Cell: (props) => {
          return <ChainIcon chainId={props.row.original.chain_id} />;
        },
      },
      {
        accessorKey: 'reward_amount',
        header: t('worker.jobs.reward'),
        size: COL_SIZE_MD,
        enableSorting: true,
        Cell: (props) => {
          const { reward_amount, reward_token } = props.row.original;
          return (
            <RewardAmount
              reward_amount={reward_amount}
              reward_token={reward_token}
              color="text.auxiliary100"
            />
          );
        },
      },
      {
        accessorKey: 'job_type',
        header: t('worker.jobs.jobType'),
        size: COL_SIZE,
        enableSorting: true,
        Cell: ({ row }) => {
          const label = t(`jobTypeLabels.${row.original.job_type as JobType}`);
          return (
            <Chip
              label={label}
              sx={{
                color: 'text.primary',
                bgcolor: 'background.subtle',
                border: 'border.strong',
              }}
            />
          );
        },
      },
      {
        accessorKey: 'expires_at',
        header: t('worker.jobs.expiryTime'),
        size: COL_SIZE_MD,
        enableSorting: true,
        Cell: (props) => {
          return (
            <Typography
              variant={isMobile ? 'body2' : 'body1'}
              sx={{
                fontWeight: 500,
                color: 'text.auxiliary100',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <TimeUntil date={props.row.original.expires_at} />
            </Typography>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('worker.jobs.status'),
        size: COL_SIZE_SM,
        enableSorting: true,
        Cell: (props) => {
          return (
            <Typography
              variant={isMobile ? 'body2' : 'body1'}
              sx={{
                fontWeight: 500,
                color: 'text.auxiliary100',
                textTransform: 'capitalize',
              }}
            >
              {props.row.original.status.toLowerCase()}
            </Typography>
          );
        },
      },
      {
        accessorKey: 'assignment_id',
        header: t('worker.jobs.action'),
        size: COL_SIZE_MD,
        enableSorting: true,
        Cell: (props) => (
          <Grid
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <MyJobsTableActions job={props.row.original} />
          </Grid>
        ),
      },
    ],
    [t, isMobile]
  );
};
