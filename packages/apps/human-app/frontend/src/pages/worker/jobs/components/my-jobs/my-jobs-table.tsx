import type { MRT_ColumnDef } from 'material-react-table';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { t } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { formatDate } from '@/shared/helpers/format-date';
import { TableHeaderCell } from '@/components/ui/table/table-header-cell';
import { Filtering } from '@/components/ui/table/table-header-menu.tsx/filtering';
import { Sorting } from '@/components/ui/table/table-header-menu.tsx/sorting';
import { Chip } from '@/components/ui/chip';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import { parseNetworkName } from '@/shared/helpers/parse-network-label';
import { shortenEscrowAddress } from '@/shared/helpers/shorten-escrow-address';
import type { MyJobs } from '@/api/servieces/worker/my-jobs-table-service-mock';
import type { JobsArray } from '@/api/servieces/worker/available-jobs-table-service-mock';
import { parseJobStatusChipColor } from './parse-job-status-chip-color';
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
          itemRef={props.itemRef}
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
              label={t('worker.jobs.filter')}
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
                  text: t('worker.jobs.sortDirection.fromHighest'),
                },
                {
                  sort: 'DESC',
                  text: t('worker.jobs.sortDirection.fromLowest'),
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
interface MyJobsTableProps {
  data?: MyJobs;
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
}

export function MyJobsTable({
  data,
  isLoading,
  isError,
  isRefetching,
}: MyJobsTableProps) {
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
