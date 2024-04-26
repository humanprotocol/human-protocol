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
import { Chip } from '@/components/ui/chip';
import { shortenEscrowAddress } from '../utils/shorten-escrow-address';
import { parseNetworkName } from '../utils/parse-network-label';
import type { AvailableJobs, JobsArray } from './available-jobs-table-service';
import { getJobsTableData } from './available-jobs-table-service';

const columns: MRT_ColumnDef<JobsArray>[] = [
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

  const { data, isLoading, isError, isRefetching } = useQuery<AvailableJobs>({
    queryKey: ['AvailableJobs', [sorting, pagination]],
    queryFn: () => getJobsTableData(),
  });

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
    },
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
    renderTopToolbar: ({ table: tab }) => (
      <SearchForm
        columnId={t('worker.jobs.escrowAddressColumnId')}
        label="Search escrow address"
        name="Search escrow address"
        placeholder="Search escrow address"
        updater={tab.setColumnFilters}
      />
    ),
  });

  return <MaterialReactTable table={table} />;
}
