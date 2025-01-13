import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import type { Oracle } from '@/modules/worker/services/oracles';
import { useColorMode } from '@/shared/hooks/use-color-mode';
import { createTableDarkMode } from '@/shared/styles/create-table-dark-mode';
import { getOraclesTablesColumns } from '@/modules/worker/components/jobs-discovery/utils/get-oracles-table-columns';

interface OraclesTableDesktopProps {
  isOraclesDataPending: boolean;
  isOraclesDataError: boolean;
  selectOracle: (oracle: Oracle) => void;
  oraclesData: Oracle[] | undefined;
}

export function OraclesTableDesktop({
  isOraclesDataPending,
  isOraclesDataError,
  selectOracle,
  oraclesData,
}: OraclesTableDesktopProps) {
  const { colorPalette, isDarkMode } = useColorMode();

  const table = useMaterialReactTable({
    state: {
      isLoading: isOraclesDataPending,
      showAlertBanner: isOraclesDataError,
    },
    columns: getOraclesTablesColumns(selectOracle),
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

  return <MaterialReactTable table={table} />;
}
