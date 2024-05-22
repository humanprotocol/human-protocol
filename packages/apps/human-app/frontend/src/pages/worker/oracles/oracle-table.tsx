import { t } from 'i18next';
import type { MRT_ColumnDef } from 'material-react-table';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import type { OracleSuccessResponse } from '@/api/servieces/worker/oracles';

const getColumns = (): MRT_ColumnDef<OracleSuccessResponse>[] => {
  return [
    {
      accessorKey: 'address',
      header: t('worker.jobs.jobDescription'),
      size: 100,
      enableSorting: false,
    },
    {
      accessorKey: 'jobTypes',
      header: t('worker.jobs.escrowAddress'),
      size: 100,
      enableSorting: true,
    },
    {
      accessorKey: 'role',
      header: t('worker.jobs.network'),
      size: 100,
      enableSorting: false,
    },
    {
      accessorKey: 'url',
      header: t('worker.jobs.rewardAmount'),
      size: 100,
      enableSorting: false,
    },
  ];
};

export function OraclesTable({
  oraclesData,
}: {
  oraclesData: OracleSuccessResponse[];
}) {
  const table = useMaterialReactTable({
    columns: getColumns(),
    data: oraclesData,
    manualPagination: false,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
  });

  return <MaterialReactTable table={table} />;
}
