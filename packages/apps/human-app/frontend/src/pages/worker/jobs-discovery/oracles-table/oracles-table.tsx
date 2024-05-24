import { t } from 'i18next';
import type { MRT_ColumnDef } from 'material-react-table';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { useNavigate } from 'react-router-dom';
import type { OracleSuccessResponse } from '@/api/servieces/worker/oracles';
import { colorPalette } from '@/styles/color-palette';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { EvmAddress } from '@/pages/worker/jobs/components/evm-address';
import { Chips } from '@/components/ui/chips';
import { TableButton } from '@/components/ui/table-button';
import { useMyJobsFilterStore } from '@/hooks/use-my-jobs-filter-store';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import { routerPaths } from '@/router/router-paths';
import { OraclesTableJobTypesSelect } from '@/pages/worker/jobs-discovery/oracles-table/oracles-table-job-types-select';
import { OraclesTableMobile } from '@/pages/worker/jobs-discovery/oracles-table/oracles-table-mobile';

const getColumns = (
  selectOracle: (oracleAddress: string, jobTypes: string[]) => void
): MRT_ColumnDef<OracleSuccessResponse>[] => {
  return [
    {
      accessorKey: 'url',
      header: t('worker.oraclesTable.annotationTool'),
      size: 100,
      enableSorting: false,
    },
    {
      accessorKey: 'address',
      header: t('worker.oraclesTable.oracleAddress'),
      size: 100,
      enableSorting: true,
      Cell: (props) => <EvmAddress address={props.row.original.address} />,
    },
    {
      accessorKey: 'jobTypes',
      header: t('worker.oraclesTable.jobTypes'),
      size: 100,
      enableSorting: false,
      Cell: (props) => {
        return <Chips data={props.row.original.jobTypes} />;
      },
    },
    {
      accessorKey: 'url',
      header: '',
      size: 100,
      enableSorting: false,
      Cell: (props) => {
        return (
          <Grid sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <TableButton
              onClick={() => {
                selectOracle(
                  props.row.original.address,
                  props.row.original.jobTypes
                );
              }}
            >
              {t('worker.oraclesTable.seeJobs')}
            </TableButton>
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
  const { setOracleAddress: setOracleAddressForMyJobs, setAvailableJobTypes } =
    useMyJobsFilterStore();
  const { setOracleAddress: setOracleAddressForJobs } = useJobsFilterStore();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const selectOracle = (oracleAddress: string, jobTypes: string[]) => {
    setOracleAddressForMyJobs(oracleAddress);
    setOracleAddressForJobs(oracleAddress);
    setAvailableJobTypes(jobTypes);
    navigate(routerPaths.worker.jobs);
  };

  const table = useMaterialReactTable({
    columns: getColumns(selectOracle),
    data: oraclesData,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
    enablePagination: false,
    enableTopToolbar: false,
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
          <OraclesTableJobTypesSelect
            jobTypes={oraclesData
              .flatMap(({ jobTypes }) => jobTypes)
              .map((jobType, i) => ({ value: jobType, name: jobType, id: i }))}
          />
          {isMobile ? (
            <OraclesTableMobile
              oraclesData={oraclesData}
              selectOracle={selectOracle}
            />
          ) : (
            <MaterialReactTable table={table} />
          )}
        </Paper>
      </Grid>
    </Grid>
  );
}
