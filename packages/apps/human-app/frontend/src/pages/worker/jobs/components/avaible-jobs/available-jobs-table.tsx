import type { MRT_ColumnDef } from 'material-react-table';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Box } from '@mui/material';
import { useTableQuery } from '@/components/ui/table/table-query-hook';
import { SearchForm } from '@/pages/playground/table-example/table-search-form';
import { Button } from '@/components/ui/button';
import { shortenEscrowAddress } from '../utils/shorten-escrow-address';
import {
  getJobsTableData,
  type AvailableJobs,
} from './available-jobs-table-service';

const columns: MRT_ColumnDef<AvailableJobs>[] = [
  {
    accessorKey: 'jobDescription',
    header: t('worker.jobs.jobDescription'),
    size: 150,
    enableSorting: true,
  },
  {
    accessorKey: 'escrowAddress',
    header: 'Escrow address',
    size: 150,
    enableSorting: true,
  },
  {
    accessorKey: 'network',
    header: 'Network',
    size: 150,
    enableSorting: true,
  },
  {
    accessorKey: 'rewardAmount',
    header: 'Reward amount',
    size: 150,
    enableSorting: true,
  },
  {
    accessorKey: 'jobTypeChips',
    header: 'Job type',
    size: 150,
    enableSorting: true,
  },
  {
    accessorKey: 'buttonColumn',
    header: '',
    size: 150,
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

  const table = useMaterialReactTable({
    columns,
    data: !data
      ? []
      : data.map((job) => ({
          ...job,
          jobTypeChips: job.jobType.map((j) => (
            <Box
              key={crypto.randomUUID()}
              sx={{
                marginRight: '5px',
              }}
            >
              {j}
            </Box>
          )),
          escrowAddress: shortenEscrowAddress(job.escrowAddress),
          buttonColumn: (
            <Button
              color="secondary"
              size="small"
              type="button"
              variant="contained"
            >
              Click
            </Button>
          ),
        })),
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
