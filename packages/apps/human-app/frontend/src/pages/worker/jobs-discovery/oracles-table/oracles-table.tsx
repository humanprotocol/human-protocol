import { t } from 'i18next';
import type { MRT_ColumnDef } from 'material-react-table';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import Grid from '@mui/material/Grid';
import { useNavigate } from 'react-router-dom';
import {
  useGetOracles,
  type OracleSuccessResponse,
} from '@/api/servieces/worker/oracles';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { EvmAddress } from '@/pages/worker/jobs/components/evm-address';
import { Chips } from '@/components/ui/chips';
import { TableButton } from '@/components/ui/table-button';
import { useMyJobsFilterStore } from '@/hooks/use-my-jobs-filter-store';
import { useJobsFilterStore } from '@/hooks/use-jobs-filter-store';
import { routerPaths } from '@/router/router-paths';
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

export function OraclesTable() {
  const {
    data: oraclesData,
    isError: isOraclesDataError,
    isPending: isOraclesDataPending,
    isRefetching: isOraclesDataRefetching,
  } = useGetOracles();
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
        <OraclesTableMobile selectOracle={selectOracle} />
      ) : (
        <MaterialReactTable table={table} />
      )}
    </>
  );
}
