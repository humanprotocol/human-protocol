import type { MRT_ColumnDef } from 'material-react-table';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { t } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import { shortenEscrowAddress } from '../utils/shorten-escrow-address';
import { parseNetworkName } from '../../../../../shared/helpers/parse-network-label';
import type { AvailableJobs, JobsArray } from './available-jobs-table-service';

const columns: MRT_ColumnDef<JobsArray>[] = [
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
];

interface AvailableJobsTableProps {
  data?: AvailableJobs;
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
}

export function AvailableJobsTable({
  data,
  isLoading,
  isError,
  isRefetching,
}: AvailableJobsTableProps) {
  const { setFilterParams, filterParams } = useJobsFilterStore();

  const [paginationState, setPaginationState] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    setFilterParams({
      ...filterParams,
      page: paginationState.pageIndex,
      pageSize: paginationState.pageSize,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid loop
  }, [paginationState]);

  const memoizedData = useMemo(() => {
    if (!data) return [];

    return data.results.map((job) => ({
      ...job,
      network: parseNetworkName(job.chain_id),
      jobTypeChips: <Chip label={job.job_type} />,
      escrowAddress: shortenEscrowAddress(job.escrow_address),
      buttonColumn: (
        <Button
          color="secondary"
          size="small"
          type="button"
          variant="contained"
        >
          {t('worker.jobs.selectJob')}
        </Button>
      ),
    }));
  }, [data]);

  const table = useMaterialReactTable({
    columns,
    data: memoizedData,
    state: {
      isLoading,
      showAlertBanner: isError,
      showProgressBars: isRefetching,
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
