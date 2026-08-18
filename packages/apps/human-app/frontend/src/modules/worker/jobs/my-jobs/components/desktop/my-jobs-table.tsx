import { useEffect, useMemo, useState } from 'react';
import {
  MaterialReactTable,
  type MRT_PaginationState,
  useMaterialReactTable,
} from 'material-react-table';

import { useGetMyJobsData, useMyJobsFilterStore } from '../../../hooks';
import { useGetMyJobsColumns } from '../../hooks/use-get-my-jobs-columns';

export function MyJobsTable() {
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
            color: 'text.auxiliary100',
          },
          '.MuiSelect-icon': {
            transition: 'none',
            fill: 'text.auxiliary100',
          },
        },
      },
    },
    muiBottomToolbarProps: {
      sx: {
        bgcolor: 'background.paper',
        boxShadow: 'none',
        color: 'text.auxiliary100',
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
        transition: 'none',
      },
    },
    muiTableHeadProps: {
      sx: {
        backgroundColor: 'background.default',
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
        borderColor: 'background.paper',
        color: 'text.auxiliary200',
        typography: 'body1',
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
        borderBottom: (theme) => `1px solid ${theme.palette.border.main}`,
      },
    },
    muiTableBodyRowProps: {
      sx: {
        bgcolor: 'background.paper',
        borderBottom: (theme) => `1px solid ${theme.palette.border.main}`,
        transition: 'none',
        '&:last-of-type': {
          borderBottom: 'none',
        },
      },
    },
  });

  return <MaterialReactTable table={table} />;
}
