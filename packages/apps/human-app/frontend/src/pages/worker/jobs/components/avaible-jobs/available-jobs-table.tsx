import type { MRT_ColumnDef } from 'material-react-table';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { useMemo } from 'react';
import { useTableQuery } from '@/components/ui/table/table-query-hook';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { Button } from '@/components/ui/button';
import { Chips } from '@/components/ui/chips';
import { shortenEscrowAddress } from '../utils/shorten-escrow-address';
import {
  getJobsTableData,
  type AvailableJobs,
} from './available-jobs-table-service';

const columns: MRT_ColumnDef<AvailableJobs>[] = [
  {
    accessorKey: 'jobDescription',
    header: t('worker.jobs.jobDescription'),
    size: 100,
    enableSorting: true,
  },
  {
    accessorKey: 'escrowAddress',
    header: 'Escrow address',
    size: 100,
    enableSorting: true,
  },
  {
    accessorKey: 'network',
    header: 'Network',
    size: 100,
    enableSorting: true,
  },
  {
    accessorKey: 'rewardAmount',
    header: 'Reward amount',
    size: 100,
    enableSorting: true,
  },
  {
    accessorKey: 'jobTypeChips',
    header: 'Job type',
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

export function AvailableJobsTable() {
  const {
    fields: { sorting, pagination },
  } = useTableQuery();

  const { data, isLoading, isError, isRefetching } = useQuery<AvailableJobs[]>({
    queryKey: ['example', [sorting, pagination]],
    queryFn: () => getJobsTableData(),
  });

  const memoizedData = useMemo(() => {
    if (!data) return [];

    return data.map((job) => ({
      ...job,
      jobTypeChips: <Chips data={job.jobType} />,
      escrowAddress: shortenEscrowAddress(job.escrowAddress),
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
    },
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
    renderTopToolbar: ({ table: tab }) => (
      <SearchForm
        columnId="escrowAddress"
        label="Search escrow address"
        name="Search escrow address"
        placeholder="Search escrow address"
        updater={tab.setColumnFilters}
      />
    ),
  });

  return <MaterialReactTable table={table} />;
}
