import { t } from 'i18next';
import type { MRT_ColumnDef } from 'material-react-table';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import type { Oracle } from '@/modules/worker/services/oracles';
import { EvmAddress } from '@/modules/worker/components/jobs/evm-address';
import { Chips } from '@/shared/components/ui/chips';
import { TableButton } from '@/shared/components/ui/table-button';
import { routerPaths } from '@/router/router-paths';
import type { OraclesDataQueryResult } from '@/modules/worker/views/jobs-discovery/jobs-discovery.page';
import { env } from '@/shared/env';
import { useGetRegistrationInExchangeOracles } from '@/modules/worker/services/get-registration-in-exchange-oracles';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';
import { type JobType } from '@/modules/smart-contracts/EthKVStore/config';
import { createTableDarkMode } from '@/shared/styles/create-table-dark-mode';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { OraclesTableMobile } from '@/modules/worker/components/jobs-discovery/oracles-table-mobile';

const getColumns = (
  selectOracle: (oracle: Oracle) => void
): MRT_ColumnDef<Oracle>[] => {
  return [
    {
      accessorKey: 'name',
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
      Cell: ({ row }) => {
        const jobTypes: string[] = [];
        for (const jobType of row.original.jobTypes) {
          jobTypes.push(t(`jobTypeLabels.${jobType as JobType}`));
        }
        return <Chips data={jobTypes} />;
      },
    },
    {
      accessorKey: 'url',
      id: 'seeJobsAction',
      header: '',
      size: 100,
      enableSorting: false,
      Cell: (props) => {
        return (
          <Grid sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <TableButton
              onClick={() => {
                selectOracle(props.row.original);
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
  const { colorPalette, isDarkMode } = useColorMode();
  const {
    data: oraclesData,
    isError: isOraclesDataError,
    isPending: isOraclesDataPending,
  } = oraclesQueryDataResult;
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuthenticatedUser();
  const { data: registrationInExchangeOraclesResult } =
    useGetRegistrationInExchangeOracles();

  const selectOracle = (oracle: Oracle) => {
    if (
      oracle.registrationNeeded &&
      !registrationInExchangeOraclesResult?.oracle_addresses.find(
        (address) => address === oracle.address
      )
    ) {
      navigate(
        `${routerPaths.worker.registrationInExchangeOracle}/${oracle.address}`
      );
      return;
    }

    if (oracle.address === env.VITE_H_CAPTCHA_ORACLE_ADDRESS) {
      if (!user.site_key) {
        navigate(routerPaths.worker.enableLabeler);
        return;
      }
      navigate(routerPaths.worker.HcaptchaLabeling);
      return;
    }
    navigate(`${routerPaths.worker.jobs}/${oracle.address}`, {
      state: {
        oracle,
      },
    });
  };

  const table = useMaterialReactTable({
    state: {
      isLoading: isOraclesDataPending,
      showAlertBanner: isOraclesDataError,
    },
    columns: getColumns(selectOracle),
    data: oraclesData ?? [],
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
    enablePagination: false,
    enableTopToolbar: false,
    enableBottomToolbar: false,
    muiTableHeadCellProps: {
      sx: {
        borderColor: colorPalette.paper.text,
      },
    },
    muiTableBodyCellProps: {
      sx: {
        borderColor: colorPalette.paper.text,
      },
    },
    muiTablePaperProps: {
      sx: {
        boxShadow: '0px 2px 2px 0px #E9EBFA80',
      },
    },
    ...(isDarkMode ? createTableDarkMode(colorPalette) : {}),
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
