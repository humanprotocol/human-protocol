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
import { TableHeaderCell } from '@/components/ui/table/table-header-cell';
import { Filtering } from '@/components/ui/table/table-header-menu.tsx/filtering';
import { Sorting } from '@/components/ui/table/table-header-menu.tsx/sorting';
import { parseJobStatusChipColor } from '@/shared/utils/parse-chip-color';
import { Chip } from '@/components/ui/chip';
import { shortenEscrowAddress } from '../utils/shorten-escrow-address';
import { JobTypesChips } from '../ui/job-types-chips';
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
                {
                  value: t('worker.jobs.Ethereum'),
                  text: t('worker.jobs.Ethereum'),
                },
                {
                  value: t('worker.jobs.Polygon'),
                  text: t('worker.jobs.Polygon'),
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

function MyJobsButton({ status, isActivated }: MyJobsButtonProps) {
  if (isActivated && status === 'Active') {
    return (
      <Button color="primary" size="small" type="button" variant="contained">
        {t('worker.jobs.resign')}
      </Button>
    );
  }
  if (!isActivated && status === 'Active') {
    return (
      <Button color="secondary" size="small" type="button" variant="contained">
        {t('worker.jobs.solve')}
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
      {t('worker.jobs.solve')}
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
      expiresAt: formatDate(job.expiresAt),
      jobTypeChips: <JobTypesChips data={job.jobType} />,
      statusChip: (
        <Chip
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
