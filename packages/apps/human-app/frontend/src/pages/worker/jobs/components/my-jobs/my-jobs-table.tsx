/* eslint-disable camelcase -- ... */
import type { MRT_ColumnDef } from 'material-react-table';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { t } from 'i18next';
import { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { TableHeaderCell } from '@/components/ui/table/table-header-cell';
import type { MyJob } from '@/api/servieces/worker/my-jobs-data';
import { useMyJobsFilterStore } from '@/hooks/use-my-jobs-filter-store';
import { getNetworkName } from '@/smart-contracts/get-network-name';
import { RewardAmount } from '@/pages/worker/jobs/components/reward-amount';
import { Chip } from '@/components/ui/chip';
import { formatDate } from '@/shared/helpers/format-date';
import { EvmAddress } from '@/pages/worker/jobs/components/evm-address';
import { MyJobsButton } from '@/pages/worker/jobs/components/my-jobs/my-jobs-button';
import { MyJobsNetworkFilter } from '@/pages/worker/jobs/components/my-jobs/my-jobs-network-filter';
import { MyJobsJobTypeFilter } from '@/pages/worker/jobs/components/my-jobs/my-jobs-job-type-filter';
import { MyJobsRewardAmountSort } from '@/pages/worker/jobs/components/my-jobs/my-jobs-reward-amount-sort';
import { MyJobsStatusFilter } from '@/pages/worker/jobs/components/my-jobs/my-jobs-status-filter';
import { MyJobsExpiresAtSort } from '@/pages/worker/jobs/components/my-jobs/my-jobs-expires-at-sort';
import { useMyJobsTableState } from '@/hooks/use-my-jobs-table-state';
import { parseJobStatusChipColor } from './parse-job-status-chip-color';

const getColumnsDefinition = (jobTypes: string[]): MRT_ColumnDef<MyJob>[] => [
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
    muiTableHeadCellProps: () => ({
      component: (props) => {
        return (
          <TableHeaderCell
            {...props}
            popoverContent={<MyJobsNetworkFilter />}
          />
        );
      },
    }),
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
    muiTableHeadCellProps: () => ({
      component: (props) => (
        <TableHeaderCell
          {...props}
          popoverContent={<MyJobsRewardAmountSort />}
        />
      ),
    }),
  },
  {
    accessorKey: 'job_type',
    header: t('worker.jobs.jobType'),
    size: 100,
    enableSorting: true,
    Cell: (props) => {
      return <Chip label={props.row.original.job_type} />;
    },
    muiTableHeadCellProps: () => ({
      component: (props) => {
        return (
          <TableHeaderCell
            {...props}
            popoverContent={<MyJobsJobTypeFilter jobTypes={jobTypes} />}
          />
        );
      },
    }),
  },
  {
    accessorKey: 'expires_at',
    header: t('worker.jobs.expiresAt'),
    size: 100,
    enableSorting: true,
    Cell: (props) => {
      return formatDate(props.row.original.expires_at);
    },
    muiTableHeadCellProps: () => ({
      component: (props) => {
        return (
          <TableHeaderCell
            {...props}
            popoverContent={<MyJobsExpiresAtSort />}
          />
        );
      },
    }),
  },
  {
    accessorKey: 'status',
    header: t('worker.jobs.status'),
    size: 100,
    enableSorting: true,
    Cell: (props) => {
      const status = props.row.original.status;
      return (
        <Chip
          backgroundColor={parseJobStatusChipColor(status)}
          label={status}
        />
      );
    },
    muiTableHeadCellProps: () => ({
      component: (props) => {
        return (
          <TableHeaderCell {...props} popoverContent={<MyJobsStatusFilter />} />
        );
      },
    }),
  },
  {
    accessorKey: 'assignment_id',
    header: '',
    size: 100,
    enableSorting: true,
    Cell: (props) => {
      const { status } = props.row.original;
      return (
        <Grid sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <MyJobsButton status={status} />
        </Grid>
      );
    },
  },
];

export function MyJobsTable() {
  const { setFilterParams, filterParams, availableJobTypes } =
    useMyJobsFilterStore();
  const { myJobsTableState, myJobsTableQueryData } = useMyJobsTableState();

  const [paginationState, setPaginationState] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  useEffect(() => {
    setFilterParams({
      ...filterParams,
      page: paginationState.pageIndex,
      page_size: paginationState.pageSize,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid loop
  }, [paginationState]);

  const table = useMaterialReactTable({
    columns: getColumnsDefinition(availableJobTypes),
    data: myJobsTableQueryData,
    state: {
      isLoading: myJobsTableState?.status === 'pending',
      showAlertBanner: Boolean(myJobsTableState?.status === 'error'),
      showProgressBars: myJobsTableState?.fetchStatus === 'fetching',
      pagination: paginationState,
    },
    manualPagination: true,
    onPaginationChange: setPaginationState,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
    renderTopToolbar: ({ table: tab }) => (
      <SearchForm
        columnId={t('worker.jobs.escrowAddressColumnId')}
        label={t('worker.jobs.searchEscrowAddress')}
        name={t('worker.jobs.searchEscrowAddress')}
        placeholder={t('worker.jobs.searchEscrowAddress')}
        updater={tab.setColumnFilters}
      />
    ),
  });

  return <MaterialReactTable table={table} />;
}
