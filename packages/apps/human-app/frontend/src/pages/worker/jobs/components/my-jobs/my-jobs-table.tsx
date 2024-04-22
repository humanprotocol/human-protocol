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
import { colorPalette } from '@/styles/color-palette';
import { formatDate } from '@/shared/utils/format-date';
import { ChipComponent, Chips } from '@/components/ui/chips';
import { TableHeaderCell } from '@/components/ui/table/table-header-cell';
import { Filtering } from '@/components/ui/table/table-header-menu.tsx/filtering';
import { Sorting } from '@/components/ui/table/table-header-menu.tsx/sorting';
import { shortenEscrowAddress } from '../utils/shorten-escrow-address';
import { getJobsTableData, type MyJobs } from './my-jobs-table-service';

const columns: MRT_ColumnDef<MyJobs>[] = [
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
                { value: 'Ethereum', text: 'Ethereum' },
                { value: 'Polygon', text: 'Polygon' },
              ]}
              label="Filter"
            />
          }
        />
      ),
    }),
  },
  {
    accessorKey: 'rewardAmount',
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
    accessorKey: 'expiresAt',
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

interface MyJobsButtonProps {
  status: MyJobs['status'];
  isActivated: boolean;
}

const parseJobStatusChipColor = (status: string) => {
  if (status === 'Overdue') {
    return colorPalette.error.main.toString();
  }
  if (status === 'Deactivated') {
    return colorPalette.error.dark.toString();
  }
  if (status === 'Complited') {
    return colorPalette.success.main.toString();
  }
  return colorPalette.primary.main.toString();
};

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
    queryKey: ['MyJobs', [sorting, pagination]],
    queryFn: () => getJobsTableData(),
  });

  const memoizedData = useMemo(() => {
    if (!data) return [];

    return data.map((job) => ({
      ...job,
      expiresAt: `${formatDate(job.expiresAt)}`,
      jobTypeChips: <Chips data={job.jobType} />,
      statusChip: (
        <ChipComponent
          backgroundColor={parseJobStatusChipColor(job.status)}
          key={job.status}
          label={job.status}
        />
      ),
      escrowAddress: shortenEscrowAddress(job.escrowAddress),
      buttonColumn: (
        <MyJobsButton isActivated={job.isActivated} status={job.status} />
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
    enableColumnActions: true,
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
