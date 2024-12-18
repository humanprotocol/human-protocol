/* eslint-disable camelcase -- ... */
import type { MRT_ColumnDef } from 'material-react-table';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { t } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { Grid } from '@mui/material';
import { useJobsFilterStore } from '@/modules/worker/hooks/use-jobs-filter-store';
import {
  useGetAvailableJobsData,
  type AvailableJob,
} from '@/modules/worker/services/available-jobs-data';
import { useAssignJobMutation } from '@/modules/worker/services/use-assign-job';
import { EvmAddress } from '@/modules/worker/components/jobs/evm-address';
import { RewardAmount } from '@/modules/worker/components/jobs/reward-amount';
import { getNetworkName } from '@/modules/smart-contracts/get-network-name';
import { Chip } from '@/shared/components/ui/chip';
import { useJobsNotifications } from '@/modules/worker/hooks/use-jobs-notifications';
import { TableButton } from '@/shared/components/ui/table-button';
import { TableHeaderCell } from '@/shared/components/ui/table/table-header-cell';
import { AvailableJobsNetworkFilter } from '@/modules/worker/components/jobs/available-jobs/desktop/available-jobs-network-filter';
import { AvailableJobsRewardAmountSort } from '@/modules/worker/components/jobs/available-jobs/desktop/available-jobs-reward-amount-sort';
import { AvailableJobsJobTypeFilter } from '@/modules/worker/components/jobs/available-jobs/desktop/available-jobs-job-type-filter';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { createTableDarkMode } from '@/shared/styles/create-table-dark-mode';
import type { JobType } from '@/modules/smart-contracts/EthKVStore/config';
import { EscrowAddressSearchForm } from '@/modules/worker/components/jobs/escrow-address-search-form';

interface AvailableJobsTableProps {
  chainIdsEnabled: number[];
}

export type AvailableJobsTableData = AvailableJob & {
  rewardTokenInfo: {
    reward_amount?: string;
    reward_token?: string;
  };
};

const getColumns = (
  chainIdsEnabled: number[]
): MRT_ColumnDef<AvailableJob>[] => [
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
    enableSorting: false,
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
            popoverContent={
              <AvailableJobsNetworkFilter chainIdsEnabled={chainIdsEnabled} />
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
            popoverContent={<AvailableJobsJobTypeFilter />}
          />
        );
      },
    }),
  },
  {
    accessorKey: 'escrow_address',
    id: 'selectJobAction',
    header: '',
    size: 100,
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

export function AvailableJobsTable({
  chainIdsEnabled,
}: AvailableJobsTableProps) {
  const { colorPalette, isDarkMode } = useColorMode();
  const {
    setSearchEscrowAddress,
    setPageParams,
    filterParams,
    resetFilterParams,
  } = useJobsFilterStore();
  const { data: tableData, status: tableStatus } = useGetAvailableJobsData();
  const memoizedTableDataResults = useMemo(
    () => tableData?.results ?? [],
    [tableData?.results]
  );

  const [paginationState, setPaginationState] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

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

  const columns: MRT_ColumnDef<AvailableJob>[] = getColumns(chainIdsEnabled);

  const table = useMaterialReactTable({
    columns,
    data: memoizedTableDataResults,
    state: {
      isLoading: tableStatus === 'pending',
      showAlertBanner: tableStatus === 'error',
      pagination: paginationState,
    },
    enablePagination: Boolean(tableData?.total_pages),
    manualPagination: true,
    onPaginationChange: setPaginationState,
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
    enableSorting: true,
    manualSorting: true,
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
