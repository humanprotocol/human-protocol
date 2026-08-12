import { useEffect, useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';

import { useJobsFilterStore } from '../../../hooks';
import { useGetAvailableJobsData } from '../../hooks/use-get-available-jobs-data';
import { useGetAvailableJobsColumns } from '../../hooks';
import { useAvailableJobsPagination } from '../../hooks/use-available-jobs-pagination';

export function AvailableJobsTableDesktop({
  oracleAddress,
}: {
  oracleAddress: string;
}) {
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
            color: 'text.auxiliary100',
          },
          '.MuiSelect-icon': {
            fill: 'text.auxiliary100',
          },
        },
      },
      rowsPerPageOptions: [5, 10],
    },
    muiBottomToolbarProps: {
      sx: {
        bgcolor: 'background.paper',
        boxShadow: 'none',
        color: 'text.auxiliary100',
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
        borderBottom: (theme) => `1px solid ${theme.palette.border.main}`,
      },
    },
    muiTableBodyRowProps: {
      sx: {
        bgcolor: 'background.paper',
        borderBottom: (theme) => `1px solid ${theme.palette.border.main}`,
        '&:last-of-type': {
          borderBottom: 'none',
        },
      },
    },
  });

  return <MaterialReactTable table={table} />;
}
