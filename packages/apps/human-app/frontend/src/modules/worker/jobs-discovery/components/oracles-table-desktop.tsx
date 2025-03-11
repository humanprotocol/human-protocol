import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import { createTableDarkMode } from '@/shared/styles/create-table-dark-mode';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useOraclesTableColumns } from '../hooks/use-oracles-table-columns';
import { type Oracle } from '../../hooks';

interface OraclesTableDesktopProps {
  isOraclesDataPending: boolean;
  isOraclesDataError: boolean;
  oraclesData: Oracle[];
}

export function OraclesTableDesktop({
  isOraclesDataPending,
  isOraclesDataError,
  oraclesData,
}: Readonly<OraclesTableDesktopProps>) {
  const { colorPalette, isDarkMode } = useColorMode();
  const tableColumns = useOraclesTableColumns();
  const table = useMaterialReactTable({
    state: {
      isLoading: isOraclesDataPending,
      showAlertBanner: isOraclesDataError,
    },
    columns: tableColumns,
    data: oraclesData,
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
