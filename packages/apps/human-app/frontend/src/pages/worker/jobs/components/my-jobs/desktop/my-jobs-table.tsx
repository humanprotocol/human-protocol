/* eslint-disable camelcase -- ...*/
import { t } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
import { Link } from 'react-router-dom';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { TableHeaderCell } from '@/components/ui/table/table-header-cell';
import {
  useGetMyJobsData,
  type MyJob,
} from '@/api/servieces/worker/my-jobs-data';
import { useMyJobsFilterStore } from '@/hooks/use-my-jobs-filter-store';
import { getNetworkName } from '@/smart-contracts/get-network-name';
import { RewardAmount } from '@/pages/worker/jobs/components/reward-amount';
import { Chip } from '@/components/ui/chip';
import { formatDate } from '@/shared/helpers/format-date';
import { EvmAddress } from '@/pages/worker/jobs/components/evm-address';
import { MyJobsJobTypeFilter } from '@/pages/worker/jobs/components/my-jobs/desktop/my-jobs-job-type-filter';
import { MyJobsRewardAmountSort } from '@/pages/worker/jobs/components/my-jobs/desktop/my-jobs-reward-amount-sort';
import { MyJobsStatusFilter } from '@/pages/worker/jobs/components/my-jobs/desktop/my-jobs-status-filter';
import { MyJobsExpiresAtSort } from '@/pages/worker/jobs/components/my-jobs/desktop/my-jobs-expires-at-sort';
import { MyJobsNetworkFilter } from '@/pages/worker/jobs/components/my-jobs/desktop/my-jobs-network-filter';
import { TableButton } from '@/components/ui/table-button';
import { useRejectTaskMutation } from '@/api/servieces/worker/reject-task';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import { RejectButton } from '@/pages/worker/jobs/components/reject-button';
import { JOB_TYPES } from '@/shared/consts';
import { parseJobStatusChipColor } from '../parse-job-status-chip-color';

const getColumnsDefinition = (
  resignJob: (assignment_id: number) => void
): MRT_ColumnDef<MyJob>[] => [
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
            headerText={t('worker.jobs.network')}
            iconType="filter"
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
          headerText={t('worker.jobs.rewardAmount')}
          iconType="filter"
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
            headerText={t('worker.jobs.jobType')}
            iconType="filter"
            popoverContent={<MyJobsJobTypeFilter jobTypes={JOB_TYPES} />}
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
            headerText={t('worker.jobs.expiresAt')}
            iconType="filter"
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
          <TableHeaderCell
            {...props}
            headerText={t('worker.jobs.status')}
            iconType="filter"
            popoverContent={<MyJobsStatusFilter />}
          />
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
      const { url, assignment_id, status } = props.row.original;
      const buttonDisabled = status !== 'ACTIVE';
      return (
        <Grid sx={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <TableButton
            component={Link}
            disabled={buttonDisabled}
            target="_blank"
            to={url}
          >
            {t('worker.jobs.solve')}
          </TableButton>
          <RejectButton
            disabled={buttonDisabled}
            onClick={() => {
              if (buttonDisabled) return;
              resignJob(assignment_id);
            }}
          />
        </Grid>
      );
    },
  },
];

export function MyJobsTable() {
  const { setSearchEscrowAddress, setPageParams, filterParams } =
    useMyJobsFilterStore();
  const { data: tableData, status: tableStatus } = useGetMyJobsData();
  const memoizedTableDataResults = useMemo(
    () => tableData?.results || [],
    [tableData?.results]
  );

  const { mutate: rejectTaskMutation } = useRejectTaskMutation();
  const {
    filterParams: { oracle_address },
  } = useJobsFilterStore();
  const [paginationState, setPaginationState] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  const rejectTask = (address: string) => {
    return (assignment_id: number) => {
      rejectTaskMutation({ address, assignment_id });
    };
  };
  useEffect(() => {
    if (!(paginationState.pageSize === 5 || paginationState.pageSize === 10))
      return;
    setPageParams(paginationState.pageIndex, paginationState.pageSize);
  }, [paginationState, setPageParams]);

  useEffect(() => {
    setPaginationState({
      pageIndex: filterParams.page,
      pageSize: filterParams.page_size,
    });
  }, [filterParams.page, filterParams.page_size]);

  const table = useMaterialReactTable({
    columns: getColumnsDefinition(rejectTask(oracle_address || '')),
    data: memoizedTableDataResults,
    state: {
      isLoading: tableStatus === 'pending',
      showAlertBanner: tableStatus === 'error',
      showProgressBars: tableStatus === 'pending',
      pagination: paginationState,
    },
    enablePagination: Boolean(tableData?.total_pages),
    manualPagination: true,
    onPaginationChange: (updater) => {
      setPaginationState(updater);
    },
    muiPaginationProps: {
      rowsPerPageOptions: [5, 10],
    },
    pageCount: tableData?.total_pages || -1,
    rowCount: tableData?.total_results,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
    renderTopToolbar: () => (
      <SearchForm
        columnId={t('worker.jobs.escrowAddressColumnId')}
        label={t('worker.jobs.searchEscrowAddress')}
        name={t('worker.jobs.searchEscrowAddress')}
        placeholder={t('worker.jobs.searchEscrowAddress')}
        updater={(address) => {
          setSearchEscrowAddress(address);
        }}
      />
    ),
  });

  return <MaterialReactTable table={table} />;
}
