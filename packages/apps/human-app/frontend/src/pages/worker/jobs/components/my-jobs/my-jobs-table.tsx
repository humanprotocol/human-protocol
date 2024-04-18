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
import { colorPalette } from '@/styles/color-palette';
import { formatDate } from '@/shared/utils/format-date';
import { shortenEscrowAddress } from '../utils/shorten-escrow-address';
import { getJobsTableData, type MyJobs } from './my-jobs-table-service';

const columns: MRT_ColumnDef<MyJobs>[] = [
  {
    accessorKey: 'escrowAddress',
    header: t('worker.jobs.escrowAddress'),
    size: 150,
    enableSorting: true,
  },
  {
    accessorKey: 'network',
    header: t('worker.jobs.network'),
    size: 150,
    enableSorting: true,
  },
  {
    accessorKey: 'rewardAmount',
    header: t('worker.jobs.rewardAmount'),
    size: 150,
    enableSorting: true,
  },
  {
    accessorKey: 'jobTypeChips',
    header: t('worker.jobs.jobType'),
    size: 150,
    enableSorting: true,
  },
  {
    accessorKey: 'expiresAt',
    header: t('worker.jobs.expiresAt'),
    size: 150,
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: t('worker.jobs.status'),
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

interface MyJobsButtonProps {
  status: MyJobs['status'];
  isActivated: boolean;
}

function MyJobsButton({ status, isActivated }: MyJobsButtonProps) {
  if (isActivated && status === 'Active') {
    return (
      <Button color="primary" size="small" type="button" variant="contained">
        Resign
      </Button>
    );
  }
  if (!isActivated && status === 'Active') {
    return (
      <Button color="secondary" size="small" type="button" variant="contained">
        Solve
      </Button>
    );
  }

  return (
    <Button
      size="small"
      sx={{
        backgroundColor: colorPalette.paper.disabled,
        color: colorPalette.paper.text,
        boxShadow: 'none',
        px: '10px',
        py: '4px',
      }}
      type="button"
      variant="contained"
    >
      Solve
    </Button>
  );
}

export function MyJobsTable() {
  const {
    fields: { sorting, pagination },
  } = useTableQuery();

  const { data, isLoading, isError, isRefetching } = useQuery<MyJobs[]>({
    queryKey: ['example', [sorting, pagination]],
    queryFn: () => getJobsTableData(),
  });

  const table = useMaterialReactTable({
    columns,
    data: !data
      ? []
      : data.map((job) => ({
          ...job,
          expiresAt: `${formatDate(job.expiresAt)}`,
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
            <MyJobsButton isActivated={job.isActivated} status={job.status} />
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
