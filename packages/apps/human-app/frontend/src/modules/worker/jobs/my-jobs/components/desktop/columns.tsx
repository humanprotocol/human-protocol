import { t } from 'i18next';
import Grid from '@mui/material/Grid';
import { type MRT_ColumnDef } from 'material-react-table';
import RefreshIcon from '@mui/icons-material/Refresh';
import { TableHeaderCell } from '@/shared/components/ui/table/table-header-cell';
import { getNetworkName } from '@/modules/smart-contracts/get-network-name';
import { Button } from '@/shared/components/ui/button';
import { Chip } from '@/shared/components/ui/chip';
import type { JobType } from '@/modules/smart-contracts/EthKVStore/config';
import { formatDate } from '@/shared/helpers/date';
import {
  EvmAddress,
  RewardAmount,
  MyJobsTableActions,
} from '../../../components';
import { type MyJob } from '../../../schemas';
import { StatusChip } from './status-chip';
import { MyJobsExpiresAtSort } from './my-jobs-expires-at-sort';
import { MyJobsJobTypeFilter } from './my-jobs-job-type-filter';
import { MyJobsNetworkFilter } from './my-jobs-network-filter';
import { MyJobsRewardAmountSort } from './my-jobs-reward-amount-sort';
import { MyJobsStatusFilter } from './my-jobs-status-filter';

export const getColumnsDefinition = ({
  refreshData,
  isRefreshTasksPending,
  chainIdsEnabled,
}: {
  refreshData: () => void;
  isRefreshTasksPending: boolean;
  chainIdsEnabled: number[];
}): MRT_ColumnDef<MyJob>[] => [
  {
    accessorKey: 'escrow_address',
    header: t('worker.jobs.escrowAddress'),
    size: 100,
    enableSorting: true,
    Cell: (props) => {
      return <EvmAddress address={props.row.original.escrow_address} />;
    },
  },
  {
    accessorKey: 'network',
    header: t('worker.jobs.network'),
    size: 100,
    Cell: (props) => {
      return getNetworkName(props.row.original.chain_id);
    },
    Header: (
      <TableHeaderCell
        headerText={t('worker.jobs.network')}
        iconType="filter"
        popoverContent={
          <MyJobsNetworkFilter chainIdsEnabled={chainIdsEnabled} />
        }
      />
    ),
  },
  {
    accessorKey: 'reward_amount',
    header: t('worker.jobs.rewardAmount'),
    size: 100,
    enableSorting: true,
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
        popoverContent={<MyJobsRewardAmountSort />}
      />
    ),
  },
  {
    accessorKey: 'job_type',
    header: t('worker.jobs.jobType'),
    size: 100,
    enableSorting: true,
    Cell: ({ row }) => {
      const label = t(`jobTypeLabels.${row.original.job_type as JobType}`);
      return <Chip label={label} />;
    },
    Header: (
      <TableHeaderCell
        headerText={t('worker.jobs.jobType')}
        iconType="filter"
        popoverContent={<MyJobsJobTypeFilter />}
      />
    ),
  },
  {
    accessorKey: 'expires_at',
    header: t('worker.jobs.expiresAt'),
    size: 100,
    enableSorting: true,
    Cell: (props) => {
      return formatDate(props.row.original.expires_at);
    },
    Header: (
      <TableHeaderCell
        headerText={t('worker.jobs.expiresAt')}
        iconType="filter"
        popoverContent={<MyJobsExpiresAtSort />}
      />
    ),
  },
  {
    accessorKey: 'status',
    header: t('worker.jobs.status'),
    size: 100,
    enableSorting: true,
    Cell: (props) => {
      const status = props.row.original.status;
      return <StatusChip status={status} />;
    },
    Header: (
      <TableHeaderCell
        headerText={t('worker.jobs.status')}
        iconType="filter"
        popoverContent={<MyJobsStatusFilter />}
      />
    ),
  },
  {
    accessorKey: 'assignment_id',
    header: t('worker.jobs.refresh'),
    size: 100,
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
    Header: (
      <Grid
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          width: '100%',
        }}
      >
        <Button
          size="small"
          sx={{
            paddingTop: '0.4rem',
            paddingBottom: '0.4rem',
            paddingInline: '1rem',
            fontSize: '13px',
          }}
          loading={isRefreshTasksPending}
          type="button"
          variant="outlined"
          onClick={refreshData}
        >
          {t('worker.jobs.refresh')}
          <RefreshIcon sx={{ marginLeft: '0.5rem' }} />
        </Button>
      </Grid>
    ),
  },
];
