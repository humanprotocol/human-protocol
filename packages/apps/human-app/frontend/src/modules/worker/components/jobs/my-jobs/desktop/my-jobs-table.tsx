/* eslint-disable camelcase -- ...*/
import { t } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
import { useParams } from 'react-router-dom';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import RefreshIcon from '@mui/icons-material/Refresh';
import { TableHeaderCell } from '@/shared/components/ui/table/table-header-cell';
import {
  useGetMyJobsData,
  type MyJob,
} from '@/modules/worker/services/my-jobs-data';
import { useMyJobsFilterStore } from '@/modules/worker/hooks/use-my-jobs-filter-store';
import { getNetworkName } from '@/modules/smart-contracts/get-network-name';
import { RewardAmount } from '@/modules/worker/components/jobs/reward-amount';
import { Button } from '@/shared/components/ui/button';
import { Chip } from '@/shared/components/ui/chip';
import { formatDate } from '@/shared/helpers/format-date';
import { EvmAddress } from '@/modules/worker/components/jobs/evm-address';
import { MyJobsJobTypeFilter } from '@/modules/worker/components/jobs/my-jobs/desktop/my-jobs-job-type-filter';
import { MyJobsRewardAmountSort } from '@/modules/worker/components/jobs/my-jobs/desktop/my-jobs-reward-amount-sort';
import { MyJobsStatusFilter } from '@/modules/worker/components/jobs/my-jobs/desktop/my-jobs-status-filter';
import { MyJobsExpiresAtSort } from '@/modules/worker/components/jobs/my-jobs/desktop/my-jobs-expires-at-sort';
import { MyJobsNetworkFilter } from '@/modules/worker/components/jobs/my-jobs/desktop/my-jobs-network-filter';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { createTableDarkMode } from '@/shared/styles/create-table-dark-mode';
import type { JobType } from '@/modules/smart-contracts/EthKVStore/config';
import { EscrowAddressSearchForm } from '@/modules/worker/components/jobs/escrow-address-search-form';
import { useRefreshTasksMutation } from '@/modules/worker/services/refresh-tasks';
import { StatusChip } from '@/modules/worker/components/jobs/status-chip';
import { MyJobsTableActions } from '../../my-jobs-table-actions';

interface MyJobsTableProps {
  chainIdsEnabled: number[];
}

const getColumnsDefinition = ({
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
    muiTableHeadCellProps: () => ({
      component: (props) => {
        return (
          <TableHeaderCell
            {...props}
            headerText={t('worker.jobs.network')}
            iconType="filter"
            popoverContent={
              <MyJobsNetworkFilter chainIdsEnabled={chainIdsEnabled} />
            }
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
            popoverContent={<MyJobsJobTypeFilter />}
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
      return <StatusChip status={status} />;
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
    header: t('worker.jobs.refresh'),
    size: 100,
    enableSorting: true,
    Cell: (props) => (
      <Grid sx={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <MyJobsTableActions job={props.row.original} />
      </Grid>
    ),
    muiTableHeadCellProps: () => ({
      component: (props) => {
        return (
          <td {...props}>
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
          </td>
        );
      },
    }),
  },
];

export function MyJobsTable({ chainIdsEnabled }: MyJobsTableProps) {
  const { colorPalette, isDarkMode } = useColorMode();
  const {
    setSearchEscrowAddress,
    setPageParams,
    filterParams,
    resetFilterParams,
  } = useMyJobsFilterStore();
  const { data: tableData, status: tableStatus } = useGetMyJobsData();

  const memoizedTableDataResults = useMemo(
    () => tableData?.results ?? [],
    [tableData?.results]
  );

  const { mutate: refreshTasksMutation, isPending: isRefreshTasksPending } =
    useRefreshTasksMutation();
  const { address: oracle_address } = useParams<{ address: string }>();

  const [paginationState, setPaginationState] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  const refreshTasks = (address: string) => {
    return () => {
      refreshTasksMutation({ oracle_address: address });
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

  useEffect(() => {
    return () => {
      resetFilterParams();
    };
  }, [resetFilterParams]);

  const table = useMaterialReactTable({
    columns: getColumnsDefinition({
      refreshData: refreshTasks(oracle_address ?? ''),
      isRefreshTasksPending,
      chainIdsEnabled,
    }),
    data: memoizedTableDataResults,
    state: {
      isLoading: tableStatus === 'pending',
      showAlertBanner: tableStatus === 'error',
      pagination: paginationState,
    },
    enablePagination: Boolean(tableData?.total_pages),
    manualPagination: true,
    onPaginationChange: (updater) => {
      setPaginationState(updater);
    },
    muiPaginationProps: {
      SelectProps: {
        sx: {
          '.MuiSelect-icon': {
            ':hover': {
              backgroundColor: 'blue',
            },
            fill: colorPalette.text.primary,
          },
        },
      },
      rowsPerPageOptions: [5, 10],
    },
    pageCount: tableData?.total_pages ?? -1,
    rowCount: tableData?.total_results,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
    renderTopToolbar: () => (
      <EscrowAddressSearchForm
        columnId={t('worker.jobs.escrowAddressColumnId')}
        label={t('worker.jobs.searchEscrowAddress')}
        placeholder={t('worker.jobs.searchEscrowAddress')}
        updater={(address) => {
          setSearchEscrowAddress(address);
        }}
      />
    ),
    muiTableHeadCellProps: {
      sx: {
        borderColor: colorPalette.paper.text,
      },
    },
    muiTableBodyCellProps: {
      sx: {
        borderColor: colorPalette.paper.text,
      },
    },
    muiTablePaperProps: {
      sx: {
        boxShadow: '0px 2px 2px 0px #E9EBFA80',
      },
    },
    ...(isDarkMode ? createTableDarkMode(colorPalette) : {}),
  });

  return <MaterialReactTable table={table} />;
}
