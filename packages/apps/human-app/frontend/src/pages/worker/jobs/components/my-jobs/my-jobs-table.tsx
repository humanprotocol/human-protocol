import type { MRT_ColumnDef } from 'material-react-table';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { useTableQuery } from '@/components/ui/table/table-query-hook';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { formatDate } from '@/shared/utils/format-date';
import { TableHeaderCell } from '@/components/ui/table/table-header-cell';
import { Filtering } from '@/components/ui/table/table-header-menu.tsx/filtering';
import { Sorting } from '@/components/ui/table/table-header-menu.tsx/sorting';
import { parseJobStatusChipColor } from '@/shared/utils/parse-chip-color';
import { Chip } from '@/components/ui/chip';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import { shortenEscrowAddress } from '../utils/shorten-escrow-address';
import type { JobsArray } from '../avaible-jobs/available-jobs-table-service';
import { parseNetworkName } from '../utils/parse-network-label';
import { getJobsTableData, type MyJobs } from './my-jobs-table-service';
import { MyJobsButton } from './my-jobs-button';

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
    muiTableHeadCellProps: () => ({
      component: (props) => (
        <TableHeaderCell
          {...props}
          popoverContent={
            <Filtering
              filteringOptions={[
                {
                  value: t('worker.jobs.mobileFilterDrawer.network.matic'),
                  text: t('worker.jobs.mobileFilterDrawer.network.matic'),
                },
                {
                  value: t('worker.jobs.mobileFilterDrawer.network.polygon'),
                  text: t('worker.jobs.mobileFilterDrawer.network.polygon'),
                },
              ]}
              label="Filter"
            />
          }
        />
      ),
    }),
  },
  {
    accessorKey: 'reward_amount',
    header: t('worker.jobs.rewardAmount'),
    size: 100,
    enableSorting: true,
    muiTableHeadCellProps: () => ({
      component: (props) => (
        <TableHeaderCell
          {...props}
          popoverContent={
            <Sorting
              columnId="rewardAmount"
              label="Sort"
              sortingOption={[
                {
                  sort: 'ASC',
                  text: 'From highest',
                },
                {
                  sort: 'DESC',
                  text: 'From lowest',
                },
              ]}
            />
          }
        />
      ),
    }),
  },
  {
    accessorKey: 'jobTypeChips',
    header: t('worker.jobs.jobType'),
    size: 200,
    enableSorting: true,
  },
  {
    accessorKey: 'expires_at',
    header: t('worker.jobs.expiresAt'),
    size: 100,
    enableSorting: true,
  },
  {
    accessorKey: 'statusChip',
    header: t('worker.jobs.status'),
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

export function MyJobsTable() {
  const { setFilterParams, filterParams } = useJobsFilterStore();

  useEffect(() => {
    setFilterParams({});
  }, [setFilterParams]);

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

  const {
    fields: { sorting, pagination },
  } = useTableQuery();

  const { data, isLoading, isError, isRefetching } = useQuery<MyJobs>({
    queryKey: ['MyJobs', [sorting, pagination]],
    queryFn: () => getJobsTableData(),
  });

  const memoizedData = useMemo(() => {
    if (!data) return [];

    return data.results.map((job) => ({
      ...job,
      // eslint-disable-next-line camelcase -- output from api
      expires_at: formatDate(job.expires_at),
      jobTypeChips: <Chip label={job.job_type} />,
      network: parseNetworkName(job.chain_id),
      statusChip: (
        <Chip
          backgroundColor={parseJobStatusChipColor(job.status)}
          key={job.status}
          label={job.status}
        />
      ),
      escrowAddress: shortenEscrowAddress(job.escrow_address),
      buttonColumn: <MyJobsButton status={job.status} />,
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
