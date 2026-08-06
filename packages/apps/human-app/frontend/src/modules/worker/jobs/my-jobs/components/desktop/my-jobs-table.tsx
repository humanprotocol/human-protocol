import { useEffect, useMemo, useState } from 'react';
import {
  MaterialReactTable,
  type MRT_PaginationState,
  useMaterialReactTable,
} from 'material-react-table';

import { useColorMode } from '@/shared/contexts/color-mode';
import { createTableDarkMode } from '@/shared/styles/create-table-dark-mode';
import { useGetMyJobsData, useMyJobsFilterStore } from '../../../hooks';
import { useGetMyJobsColumns } from '../../hooks/use-get-my-jobs-columns';

export function MyJobsTable() {
  const { colorPalette, isDarkMode } = useColorMode();
  const { data: tableData, isPending, isError } = useGetMyJobsData();
  const { setPageParams, filterParams } = useMyJobsFilterStore();
  const [paginationState, setPaginationState] = useState<MRT_PaginationState>(
    () => ({
      pageIndex: filterParams.page,
      pageSize: filterParams.page_size,
    })
  );

  const memoizedTableDataResults = useMemo(
    () => tableData?.results ?? [],
    [tableData?.results]
  );

  const columns = useGetMyJobsColumns();

  useEffect(() => {
    if (paginationState.pageSize === 5 || paginationState.pageSize === 10) {
      setPageParams(paginationState.pageIndex, paginationState.pageSize);
    }
  }, [paginationState.pageIndex, paginationState.pageSize, setPageParams]);

  useEffect(() => {
    setPaginationState((currentPaginationState) => {
      if (
        currentPaginationState.pageIndex === filterParams.page &&
        currentPaginationState.pageSize === filterParams.page_size
      ) {
        return currentPaginationState;
      }

      return {
        pageIndex: filterParams.page,
        pageSize: filterParams.page_size,
      };
    });
  }, [filterParams.page, filterParams.page_size]);

  const table = useMaterialReactTable({
    columns,
    data: memoizedTableDataResults,
    state: {
      isLoading: isPending,
      showAlertBanner: isError,
      pagination: paginationState,
    },
    enablePagination: !!tableData?.total_pages,
    manualPagination: true,
    onPaginationChange: setPaginationState,
    muiPaginationProps: {
      rowsPerPageOptions: [5, 10],
      SelectProps: {
        sx: {
          '.MuiSelect-select': {
            color: colorPalette.text.auxiliary100,
          },
          '.MuiSelect-icon': {
            transition: 'none',
            ':hover': {
              backgroundColor: 'blue',
            },
            fill: colorPalette.text.auxiliary100,
          },
        },
      },
    },
    muiBottomToolbarProps: {
      sx: {
        bgcolor: colorPalette.background.paper,
        boxShadow: 'none',
        color: colorPalette.text.auxiliary100,
        transition: 'none',
      },
    },
    pageCount: tableData?.total_pages ?? -1,
    rowCount: tableData?.total_results,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
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
        transition: 'none',
        '&:last-of-type': {
          borderBottom: 'none',
        },
      },
    },
    ...(isDarkMode ? createTableDarkMode(colorPalette) : {}),
  });

  return <MaterialReactTable table={table} />;
}
