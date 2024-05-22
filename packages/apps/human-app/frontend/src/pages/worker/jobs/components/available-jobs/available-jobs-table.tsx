/* eslint-disable camelcase -- ... */
import type { MRT_ColumnDef } from 'material-react-table';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { t } from 'i18next';
import { useEffect, useState } from 'react';
import { Grid, Typography } from '@mui/material';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import type { AvailableJob } from '@/api/servieces/worker/available-jobs-data';
import type { AssignJobBody } from '@/api/servieces/worker/assign-job';
import { useAssignJobMutation } from '@/api/servieces/worker/assign-job';
import { EvmAddress } from '@/pages/worker/jobs/components/evm-address';
import { RewardAmount } from '@/pages/worker/jobs/components/reward-amount';
import { getNetworkName } from '@/smart-contracts/get-network-name';
import { Chip } from '@/components/ui/chip';
import { useJobsNotifications } from '@/hooks/use-jobs-notifications';
import { useAvailableJobsTableState } from '@/hooks/use-available-jobs-table-state';
import { colorPalette } from '@/styles/color-palette';
import { TableButton } from '@/components/ui/table-button';

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
    },
    {
      accessorKey: 'job_type',
      header: t('worker.jobs.jobType'),
      size: 200,
      enableSorting: false,
      Cell: (props) => {
        return <Chip label={props.row.original.job_type} />;
      },
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
  const { setFilterParams, filterParams } = useJobsFilterStore();
  const { onJobAssignmentError, onJobAssignmentSuccess } =
    useJobsNotifications();

  const { mutate: assignJobMutation, isPending: isAssignJobMutationPending } =
    useAssignJobMutation({
      onSuccess: onJobAssignmentSuccess,
      onError: onJobAssignmentError,
    });

  const { availableJobsTableState, availableJobsTableQueryData } =
    useAvailableJobsTableState();

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
    columns: getColumns({
      assignJob: (data) => {
        assignJobMutation(data);
      },
    }),
    data: availableJobsTableQueryData,
    state: {
      isLoading: availableJobsTableState?.status === 'pending',
      showAlertBanner: Boolean(availableJobsTableState?.status === 'error'),
      showProgressBars:
        availableJobsTableState?.fetchStatus === 'fetching' ||
        isAssignJobMutationPending,
      pagination: paginationState,
    },
    manualPagination: true,
    onPaginationChange: setPaginationState,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: true,
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
