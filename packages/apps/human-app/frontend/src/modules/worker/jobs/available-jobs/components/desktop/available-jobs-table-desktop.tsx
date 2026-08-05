import { useEffect, useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';

import { createTableDarkMode } from '@/shared/styles/create-table-dark-mode';
import { useColorMode } from '@/shared/contexts/color-mode';
import { useJobsFilterStore } from '../../../hooks';
import { useGetAvailableJobsData } from '../../hooks/use-get-available-jobs-data';
import { useGetAvailableJobsColumns } from '../../hooks';
import { useAvailableJobsPagination } from '../../hooks/use-available-jobs-pagination';

export function AvailableJobsTableDesktop({
  oracleAddress,
}: {
  oracleAddress: string;
}) {
  const { colorPalette, isDarkMode } = useColorMode();
  const { data: tableData, status: tableStatus } = useGetAvailableJobsData({
    oracleAddress,
  });
  const { setPageParams, filterParams, resetFilterParams } =
    useJobsFilterStore();
  const { paginationState, setPaginationState } = useAvailableJobsPagination({
    setPageParams,
    filterParams,
  });
  const columns = useGetAvailableJobsColumns();

  const memoizedTableDataResults = useMemo(
    () => tableData?.results ?? [],
    [tableData?.results]
  );

  useEffect(() => {
    return () => {
      resetFilterParams();
    };
  }, [resetFilterParams]);

  const table = useMaterialReactTable({
    columns,
    data: memoizedTableDataResults,
    state: {
      isLoading: tableStatus === 'pending',
      showAlertBanner: tableStatus === 'error',
      pagination: paginationState,
    },
    enablePagination: !!tableData?.total_pages,
    manualPagination: true,
    onPaginationChange: setPaginationState,
    muiPaginationProps: {
      SelectProps: {
        sx: {
          '.MuiSelect-select': {
            color: colorPalette.text.auxiliary100,
          },
          '.MuiSelect-icon': {
            ':hover': {
              backgroundColor: 'blue',
            },
            fill: colorPalette.text.auxiliary100,
          },
        },
      },
      rowsPerPageOptions: [5, 10],
    },
    muiBottomToolbarProps: {
      sx: {
        bgcolor: colorPalette.background.paper,
        boxShadow: 'none',
        color: colorPalette.text.auxiliary100,
      },
    },
    pageCount: tableData?.total_pages ?? -1,
    rowCount: tableData?.total_results,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
    manualSorting: false,
    renderTopToolbar: false,
    muiTablePaperProps: {
      sx: {
        boxShadow: 'none',
      },
    },
    muiTableHeadProps: {
      sx: {
        backgroundColor: colorPalette.background.default,
      },
    },
    muiTableHeadRowProps: {
      sx: {
        backgroundColor: 'inherit',
        boxShadow: 'none',
      },
    },
    muiTableHeadCellProps: {
      sx: {
        paddingTop: '8px',
        paddingBottom: '8px',
        paddingLeft: '12px',
        paddingRight: '12px',
        borderColor: colorPalette.background.paper,
        color: colorPalette.text.auxiliary200,
        typography: 'body1',
        fontWeight: 500,
        '& .Mui-TableHeadCell-Content': {
          justifyContent: 'center',
          textAlign: 'center',
        },
      },
    },
    muiTableBodyCellProps: {
      align: 'center',
      sx: {
        textAlign: 'center',
        borderBottom: `1px solid ${colorPalette.border.main}`,
      },
    },
    muiTableBodyRowProps: {
      sx: {
        bgcolor: colorPalette.background.paper,
        borderBottom: `1px solid ${colorPalette.border.main}`,
        '&:last-of-type': {
          borderBottom: 'none',
        },
      },
    },
    ...(isDarkMode ? createTableDarkMode(colorPalette) : {}),
  });

  return <MaterialReactTable table={table} />;
}
