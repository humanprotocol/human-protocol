import type { MRT_ColumnDef } from 'material-react-table';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { t } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import { parseNetworkName } from '@/shared/helpers/parse-network-label';
import { shortenEscrowAddress } from '@/shared/helpers/shorten-escrow-address';
import type {
  AvailableJob,
  AvailableJobsSuccessResponse,
} from '@/api/servieces/worker/available-jobs-data';

interface AvailableJobTableData {
  jobDescription?: string;
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
    enableSorting: true,
  },
  {
    accessorKey: 'escrowAddress',
    header: t('worker.jobs.escrowAddress'),
    size: 100,
    enableSorting: true,
  },
  {
    accessorKey: 'network',
    header: t('worker.jobs.network'),
    size: 100,
    enableSorting: true,
  },
  {
    accessorKey: 'jobTypeChips',
    header: t('worker.jobs.jobType'),
    size: 200,
    enableSorting: true,
  },
  {
    accessorKey: 'buttonColumn',
    header: '',
    size: 100,
    enableSorting: true,
  },
  {
    accessorKey: 'buttonColumn',
    header: '',
    size: 100,
    enableSorting: true,
  },
];

const mapAvailableJobsResponseToTableData = (
  responseData: AvailableJob[]
): AvailableJobTableData[] => {
  return responseData.map((job) => ({
    jobDescription: job.job_description,
    network: parseNetworkName(job.chain_id),
    jobTypeChips: <Chip label={job.job_type} />,
    escrowAddress: shortenEscrowAddress(job.escrow_address),
    buttonColumn: (
      <Button color="secondary" size="small" type="button" variant="contained">
        {t('worker.jobs.selectJob')}
      </Button>
    ),
  }));
};

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
      // eslint-disable-next-line camelcase -- ...
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
