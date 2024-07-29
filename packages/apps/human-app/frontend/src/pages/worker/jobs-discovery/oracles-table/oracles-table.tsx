import { t } from 'i18next';
import type { MRT_ColumnDef } from 'material-react-table';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import Grid from '@mui/material/Grid';
import { useNavigate } from 'react-router-dom';
import { type OracleSuccessResponse } from '@/api/servieces/worker/oracles';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { EvmAddress } from '@/pages/worker/jobs/components/evm-address';
import { Chips } from '@/components/ui/chips';
import { TableButton } from '@/components/ui/table-button';
import { routerPaths } from '@/router/router-paths';
import { OraclesTableMobile } from '@/pages/worker/jobs-discovery/oracles-table/oracles-table-mobile';
import type { OraclesDataQueryResult } from '@/pages/worker/jobs-discovery/jobs-discovery.page';

const getColumns = (
  selectOracle: (oracleAddress: string) => void
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
                selectOracle(props.row.original.address);
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
  oraclesQueryDataResult,
}: {
  oraclesQueryDataResult: OraclesDataQueryResult;
}) {
  const {
    data: oraclesData,
    isError: isOraclesDataError,
    isRefetching: isOraclesDataRefetching,
    isPending: isOraclesDataPending,
  } = oraclesQueryDataResult;
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const selectOracle = (oracleAddress: string) => {
    navigate(`${routerPaths.worker.jobs}/${oracleAddress}`);
  };

  const table = useMaterialReactTable({
    state: {
      isLoading: isOraclesDataPending,
      showAlertBanner: isOraclesDataError,
      showProgressBars: isOraclesDataRefetching,
    },
    columns: getColumns(selectOracle),
    data: oraclesData || [],
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
    enablePagination: false,
    enableTopToolbar: false,
  });

  return (
    <>
      {isMobile ? (
        <OraclesTableMobile
          oraclesQueryDataResult={oraclesQueryDataResult}
          selectOracle={selectOracle}
        />
      ) : (
        <MaterialReactTable table={table} />
      )}
    </>
  );
}
