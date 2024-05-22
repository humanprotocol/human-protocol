import { t } from 'i18next';
import type { MRT_ColumnDef } from 'material-react-table';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import type { OracleSuccessResponse } from '@/api/servieces/worker/oracles';
import { colorPalette } from '@/styles/color-palette';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Button } from '@/components/ui/button';

const getColumns = (): MRT_ColumnDef<OracleSuccessResponse>[] => {
  return [
    {
      accessorKey: 'url',
      header: t('worker.jobs.jobDescription'),
      size: 100,
      enableSorting: false,
    },
    {
      accessorKey: 'address',
      header: t('worker.jobs.escrowAddress'),
      size: 100,
      enableSorting: true,
    },
    {
      accessorKey: 'jobTypes',
      header: t('worker.jobs.network'),
      size: 100,
      enableSorting: false,
    },
    {
      accessorKey: 'url',
      header: '',
      size: 100,
      enableSorting: false,
      Cell: () => {
        return (
          <Grid sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained">Test</Button>
          </Grid>
        );
      },
    },
  ];
};

export function OraclesTable({
  oraclesData,
}: {
  oraclesData: OracleSuccessResponse[];
}) {
  const isMobile = useIsMobile();
  const table = useMaterialReactTable({
    columns: getColumns(),
    data: oraclesData,
    manualPagination: false,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
  });

  return (
    <Grid alignItems="center" container justifyContent="center">
      <Grid item xs={12}>
        <Paper
          sx={{
            backgroundColor: isMobile
              ? colorPalette.paper.main
              : colorPalette.white,
            height: '100%',
            boxShadow: 'none',
            padding: '40px',
            minHeight: '800px',
            borderRadius: '20px',
          }}
        >
          <MaterialReactTable table={table} />;
        </Paper>
      </Grid>
    </Grid>
  );
}
