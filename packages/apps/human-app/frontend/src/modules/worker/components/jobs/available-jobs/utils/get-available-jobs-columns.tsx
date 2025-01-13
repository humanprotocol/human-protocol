/* eslint-disable camelcase -- ... */
import type { MRT_ColumnDef } from 'material-react-table';
import { t } from 'i18next';
import { Grid } from '@mui/material';
import { type AvailableJob } from '@/modules/worker/services/available-jobs-data';
import { useAssignJobMutation } from '@/modules/worker/services/use-assign-job';
import { EvmAddress } from '@/modules/worker/components/jobs/evm-address';
import { RewardAmount } from '@/modules/worker/components/jobs/reward-amount';
import { getNetworkName } from '@/modules/smart-contracts/get-network-name';
import { Chip } from '@/shared/components/ui/chip';
import { useJobsNotifications } from '@/modules/worker/hooks/use-jobs-notifications';
import { TableButton } from '@/shared/components/ui/table-button';
import { TableHeaderCell } from '@/shared/components/ui/table/table-header-cell';
import { AvailableJobsNetworkFilter } from '@/modules/worker/components/jobs/available-jobs/components/available-jobs-network-filter';
import { AvailableJobsRewardAmountSort } from '@/modules/worker/components/jobs/available-jobs/components/available-jobs-reward-amount-sort';
import { AvailableJobsJobTypeFilter } from '@/modules/worker/components/jobs/available-jobs/components/available-jobs-job-type-filter';
import type { JobType } from '@/modules/smart-contracts/EthKVStore/config';

const COL_SIZE = 100;
const COL_SIZE_LG = 200;

export const getAvailableJobsColumns = (
  chainIdsEnabled: number[]
): MRT_ColumnDef<AvailableJob>[] => [
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
    muiTableHeadCellProps: () => ({
      component: (props) => {
        return (
          <TableHeaderCell
            {...props}
            headerText={t('worker.jobs.network')}
            iconType="filter"
            popoverContent={
              <AvailableJobsNetworkFilter
                isMobile
                chainIdsEnabled={chainIdsEnabled}
              />
            }
          />
        );
      },
    }),
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
    muiTableHeadCellProps: () => ({
      component: (props) => (
        <TableHeaderCell
          {...props}
          headerText={t('worker.jobs.rewardAmount')}
          iconType="filter"
          popoverContent={<AvailableJobsRewardAmountSort />}
        />
      ),
    }),
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
    muiTableHeadCellProps: () => ({
      component: (props) => {
        return (
          <TableHeaderCell
            {...props}
            headerText={t('worker.jobs.jobType')}
            iconType="filter"
            popoverContent={<AvailableJobsJobTypeFilter isMobile />}
          />
        );
      },
    }),
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
];
