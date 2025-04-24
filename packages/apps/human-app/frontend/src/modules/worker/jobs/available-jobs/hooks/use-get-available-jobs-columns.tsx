/* eslint-disable camelcase -- ... */
import type { MRT_ColumnDef } from 'material-react-table';
import { t } from 'i18next';
import { Grid } from '@mui/material';
import { useMemo } from 'react';
import { getNetworkName } from '@/modules/smart-contracts/get-network-name';
import { Chip } from '@/shared/components/ui/chip';
import { TableButton } from '@/shared/components/ui/table-button';
import { TableHeaderCell } from '@/shared/components/ui/table/table-header-cell';
import type { JobType } from '@/modules/smart-contracts/EthKVStore/config';
import { useJobsNotifications } from '../../hooks';
import { EvmAddress, RewardAmount } from '../../components';
import {
  AvailableJobsNetworkFilter,
  AvailableJobsRewardAmountSort,
  AvailableJobsJobTypeFilter,
} from '../components';
import { type AvailableJob } from '../../types';
import { useAssignJobMutation } from './use-assign-job';

const COL_SIZE = 100;
const COL_SIZE_LG = 200;

export const useGetAvailableJobsColumns = (
  chainIdsEnabled: number[]
): MRT_ColumnDef<AvailableJob>[] => {
  return useMemo(
    () => [
      {
        accessorKey: 'job_description',
        header: t('worker.jobs.jobDescription'),
        size: COL_SIZE,
        enableSorting: false,
      },
      {
        accessorKey: 'escrow_address',
        header: t('worker.jobs.escrowAddress'),
        size: COL_SIZE,
        enableSorting: false,
        Cell: (props) => {
          return <EvmAddress address={props.cell.getValue() as string} />;
        },
      },
      {
        accessorKey: 'chain_id',
        header: t('worker.jobs.network'),
        size: COL_SIZE,
        enableSorting: false,
        Cell: (props) => {
          return getNetworkName(props.row.original.chain_id);
        },
        Header: (
          <TableHeaderCell
            headerText={t('worker.jobs.network')}
            iconType="filter"
            popoverContent={
              <AvailableJobsNetworkFilter
                chainIdsEnabled={chainIdsEnabled}
                showClearButton
                showTitle
              />
            }
          />
        ),
      },
      {
        accessorKey: 'reward_amount',
        header: t('worker.jobs.rewardAmount'),
        size: COL_SIZE,
        enableSorting: false,
        Cell: (props) => {
          const { reward_amount, reward_token } = props.row.original;
          return (
            <RewardAmount
              reward_amount={reward_amount}
              reward_token={reward_token}
            />
          );
        },
        Header: (
          <TableHeaderCell
            headerText={t('worker.jobs.rewardAmount')}
            iconType="filter"
            popoverContent={<AvailableJobsRewardAmountSort />}
          />
        ),
      },
      {
        accessorKey: 'job_type',
        header: t('worker.jobs.jobType'),
        size: COL_SIZE_LG,
        enableSorting: false,
        Cell: ({ row }) => {
          const label = t(`jobTypeLabels.${row.original.job_type as JobType}`);
          return <Chip label={label} />;
        },
        Header: (
          <TableHeaderCell
            headerText={t('worker.jobs.jobType')}
            iconType="filter"
            popoverContent={
              <AvailableJobsJobTypeFilter showClearButton showTitle />
            }
          />
        ),
      },
      {
        accessorKey: 'escrow_address',
        id: 'selectJobAction',
        header: '',
        size: COL_SIZE,
        enableSorting: false,
        Cell: (props) => {
          const { escrow_address, chain_id } = props.row.original;
          const { onJobAssignmentError, onJobAssignmentSuccess } =
            useJobsNotifications();
          const { mutate: assignJobMutation, isPending } = useAssignJobMutation(
            {
              onSuccess: onJobAssignmentSuccess,
              onError: onJobAssignmentError,
            },
            [`assignJob-${escrow_address}`]
          );

          return (
            <Grid sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <TableButton
                loading={isPending}
                onClick={() => {
                  assignJobMutation({ escrow_address, chain_id });
                }}
                sx={{
                  width: '94px',
                }}
              >
                {t('worker.jobs.selectJob')}
              </TableButton>
            </Grid>
          );
        },
      },
    ],
    [chainIdsEnabled]
  );
};
