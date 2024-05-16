/* eslint-disable camelcase -- ... */
import type { MRT_ColumnDef } from 'material-react-table';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { t } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import type {
  AvailableJob,
  AvailableJobsSuccessResponse,
} from '@/api/servieces/worker/available-jobs-data';
import type { AssignJobBody } from '@/api/servieces/worker/assign-job';
import { useAssignJobMutation } from '@/api/servieces/worker/assign-job';
import { useProtectedLayoutNotification } from '@/hooks/use-protected-layout-notifications';
import { wait } from '@/shared/helpers/wait';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { EscrowAddress } from '@/pages/worker/jobs/components/available-jobs/escrow-address';
import { RewardAmount } from '@/pages/worker/jobs/components/available-jobs/reward-amount';
import { Button } from '@/components/ui/button';
import { getNetworkName } from '@/smart-contracts/get-network-name';
import { Chip } from '@/components/ui/chip';

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
        return <EscrowAddress address={props.cell.getValue() as string} />;
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
          <Button
            color="secondary"
            onClick={() => {
              callbacks.assignJob({ escrow_address, chain_id });
            }}
            size="small"
            type="button"
            variant="contained"
          >
            {t('worker.jobs.selectJob')}
          </Button>
        );
      },
    },
  ];
};

export function AvailableJobsTable() {
  const { setFilterParams, filterParams } = useJobsFilterStore();
  const { setTopNotification, closeNotification } =
    useProtectedLayoutNotification();

  const onJobAssignmentSuccess = async () => {
    setTopNotification({
      content: 'Successfully assigned a job!',
      type: 'success',
    });
    await wait(5000);
    closeNotification();
  };

  const onJobAssignmentError = async (error: unknown) => {
    setTopNotification({
      content: defaultErrorMessage(error),
      type: 'warning',
    });
    await wait(5000);
    closeNotification();
  };

  const queryClient = useQueryClient();
  const { mutate: assignJobMutation, isPending: isAssignJobMutationPending } =
    useAssignJobMutation({
      onSuccess: onJobAssignmentSuccess,
      onError: onJobAssignmentError,
    });

  const availableJobsTableState = queryClient.getQueryState([
    'availableJobs',
    filterParams,
  ]);
  const queryData = queryClient.getQueryData<AvailableJobsSuccessResponse>([
    'availableJobs',
    filterParams,
  ]);

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

  const memoizedData = useMemo(() => {
    if (!queryData?.results) return [];
    return queryData.results;
  }, [queryData?.results]);

  const table = useMaterialReactTable({
    columns: getColumns({
      assignJob: (data) => {
        assignJobMutation(data);
      },
    }),
    data: memoizedData,
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
