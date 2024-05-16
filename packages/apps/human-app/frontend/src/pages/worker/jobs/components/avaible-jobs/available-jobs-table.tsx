/* eslint-disable camelcase -- ... */
import type { MRT_ColumnDef } from 'material-react-table';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { t } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import type { AvailableJobsSuccessResponse } from '@/api/servieces/worker/available-jobs-data';
import { mapAvailableJobsResponseToTableData } from '@/pages/worker/jobs/components/avaible-jobs/map-avialable-jobs-data-to-table-data';
import { shortenEscrowAddress } from '@/shared/helpers/shorten-escrow-address';

export interface AvailableJobTableData {
  jobDescription?: string;
  rewardTokenInfo?: JSX.Element | string;
  network: string;
  jobTypeChips: JSX.Element;
  escrowAddress: string;
  buttonColumn: JSX.Element;
}

const columns: MRT_ColumnDef<AvailableJobTableData>[] = [
  {
    accessorKey: 'jobDescription',
    header: t('worker.jobs.jobDescription'),
    size: 100,
    enableSorting: false,
  },
  {
    accessorKey: 'escrowAddress',
    header: t('worker.jobs.escrowAddress'),
    size: 100,
    enableSorting: true,
    Cell: (props) => {
      return (
        <Tooltip title={props.cell.getValue() as string}>
          <Typography variant="body2">
            {shortenEscrowAddress(props.cell.getValue() as string)}
          </Typography>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: 'network',
    header: t('worker.jobs.network'),
    size: 100,
    enableSorting: false,
  },
  {
    accessorKey: 'rewardTokenInfo',
    header: t('worker.jobs.rewardAmount'),
    size: 100,
    enableSorting: false,
  },
  {
    accessorKey: 'jobTypeChips',
    header: t('worker.jobs.jobType'),
    size: 200,
    enableSorting: false,
  },
  {
    accessorKey: 'buttonColumn',
    header: '',
    size: 100,
    enableSorting: false,
  },
];

export function AvailableJobsTable() {
  const { setFilterParams, filterParams } = useJobsFilterStore();
  const queryClient = useQueryClient();
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
    return mapAvailableJobsResponseToTableData(queryData.results);
  }, [queryData?.results]);

  const table = useMaterialReactTable({
    columns,
    data: memoizedData,
    state: {
      isLoading: availableJobsTableState?.status === 'pending',
      showAlertBanner: Boolean(availableJobsTableState?.status === 'error'),
      showProgressBars: availableJobsTableState?.fetchStatus === 'fetching',
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
