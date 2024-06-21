/* eslint-disable camelcase -- ... */
import type { MRT_ColumnDef } from 'material-react-table';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { t } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { Grid, Typography } from '@mui/material';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import {
  useGetAvailableJobsData,
  type AvailableJob,
} from '@/api/servieces/worker/available-jobs-data';
import type { AssignJobBody } from '@/api/servieces/worker/assign-job';
import { useAssignJobMutation } from '@/api/servieces/worker/assign-job';
import { EvmAddress } from '@/pages/worker/jobs/components/evm-address';
import { RewardAmount } from '@/pages/worker/jobs/components/reward-amount';
import { getNetworkName } from '@/smart-contracts/get-network-name';
import { Chip } from '@/components/ui/chip';
import { useJobsNotifications } from '@/hooks/use-jobs-notifications';
import { colorPalette } from '@/styles/color-palette';
import { TableButton } from '@/components/ui/table-button';
import { TableHeaderCell } from '@/components/ui/table/table-header-cell';
import { AvailableJobsRewardAmountSort } from '@/pages/worker/jobs/components/available-jobs/available-jobs-reward-amount-sort';
import { AvailableJobsNetworkFilter } from '@/pages/worker/jobs/components/available-jobs/available-jobs-network-filter';
import { AvailableJobsJobTypeFilter } from '@/pages/worker/jobs/components/available-jobs/available-jobs-job-type-filter';

export type AvailableJobsTableData = AvailableJob & {
  rewardTokenInfo: {
    reward_amount?: number;
    reward_token?: string;
  };
};

const getColumns = (callbacks: {
  assignJob: (data: AssignJobBody) => undefined;
}): MRT_ColumnDef<AvailableJob>[] => {
  return [
    {
      accessorKey: 'job_description',
      header: t('worker.jobs.jobDescription'),
      size: 100,
      enableSorting: false,
    },
    {
      accessorKey: 'escrow_address',
      header: t('worker.jobs.escrowAddress'),
      size: 100,
      enableSorting: true,
      Cell: (props) => {
        return <EvmAddress address={props.cell.getValue() as string} />;
      },
    },
    {
      accessorKey: 'chain_id',
      header: t('worker.jobs.network'),
      size: 100,
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
              popoverContent={<AvailableJobsNetworkFilter />}
            />
          );
        },
      }),
    },
    {
      accessorKey: 'reward_amount',
      header: t('worker.jobs.rewardAmount'),
      size: 100,
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
      size: 200,
      enableSorting: false,
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
              popoverContent={
                // TODO add available job types
                <AvailableJobsJobTypeFilter jobTypes={['FORTUNE', 'TEST']} />
              }
            />
          );
        },
      }),
    },
    {
      accessorKey: 'escrow_address',
      header: '',
      size: 100,
      enableSorting: false,
      Cell: (props) => {
        const { escrow_address, chain_id } = props.row.original;
        return (
          <Grid sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <TableButton
              onClick={() => {
                callbacks.assignJob({ escrow_address, chain_id });
              }}
            >
              <Typography color={colorPalette.white} variant="buttonSmall">
                {t('worker.jobs.selectJob')}
              </Typography>
            </TableButton>
          </Grid>
        );
      },
    },
  ];
};

export function AvailableJobsTable() {
  const { setFilterParams, filterParams, setSearchEscrowAddress } =
    useJobsFilterStore();
  const { onJobAssignmentError, onJobAssignmentSuccess } =
    useJobsNotifications();
  const { data: tableData, status: tableStatus } = useGetAvailableJobsData();
  const memoizedTableDataResults = useMemo(
    () => tableData?.results || [],
    [tableData?.results]
  );

  const { mutate: assignJobMutation, isPending: isAssignJobMutationPending } =
    useAssignJobMutation({
      onSuccess: onJobAssignmentSuccess,
      onError: onJobAssignmentError,
    });

  const [paginationState, setPaginationState] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  const [sortingState, setSortingState] = useState<
    { id: string; desc: boolean }[]
  >([]);

  useEffect(() => {
    setFilterParams({
      ...filterParams,
      page: paginationState.pageIndex,
      page_size: paginationState.pageSize,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid loop
  }, [paginationState]);
  useEffect(() => {
    if (sortingState.length) {
      setFilterParams({
        ...filterParams,
        sort_field: sortingState[0].id as 'escrow_address',
        sort: sortingState[0].desc ? 'DESC' : 'ASC',
      });
      return;
    }
    setFilterParams({
      ...filterParams,
      sort_field: undefined,
      sort: undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid loop
  }, [sortingState]);

  const table = useMaterialReactTable({
    columns: getColumns({
      assignJob: (data) => {
        assignJobMutation(data);
      },
    }),
    data: memoizedTableDataResults,
    state: {
      isLoading: tableStatus === 'pending',
      showAlertBanner: tableStatus === 'error',
      showProgressBars: tableStatus === 'pending' || isAssignJobMutationPending,
      pagination: paginationState,
      sorting: sortingState,
    },
    enablePagination: true,
    manualPagination: true,
    onPaginationChange: setPaginationState,
    pageCount: tableData?.total_pages,
    rowCount: tableData?.total_results,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: true,
    manualSorting: true,
    onSortingChange: setSortingState,
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
