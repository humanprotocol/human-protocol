import { Typography } from '@mui/material';
import {
  GridColDef,
  GridRenderCellParams,
  GridSortModel,
  GridCallbackDetails,
  GridValidRowModel,
} from '@mui/x-data-grid';
import { GridApiCommunity } from '@mui/x-data-grid/models/api/gridApiCommunity';
import { useMemo, useCallback, MutableRefObject } from 'react';
import { useBreakPoints } from '@utils/hooks/use-is-mobile';

interface IColPossibleOptions {
  isRowIdx?: boolean;
  pinnedColumnName?: string;
}

interface IProps<T extends GridValidRowModel> extends IColPossibleOptions {
  columns: GridColDef<T>[];
  apiRef: MutableRefObject<GridApiCommunity>;
}

export function useDatagridOptions<T extends GridValidRowModel>({
  apiRef,
  columns,
  isRowIdx,
  pinnedColumnName,
}: IProps<T>) {
  const {
    mobile: { isMobile },
  } = useBreakPoints();

  const handlePinnedColOption = useCallback(
    (cols: GridColDef<T>[]) =>
      cols.map((col) =>
        col.field === pinnedColumnName
          ? {
              ...col,
              headerClassName: isMobile
                ? 'home-page-table-header pinned-column--header'
                : 'home-page-table-header',
              cellClassName: isMobile ? 'pinned-column--cell' : '',
            }
          : col
      ),
    [isMobile, pinnedColumnName]
  );

  const handleRowOrderNum = useCallback(
    (cols: GridColDef<T>[]) => {
      return isMobile
        ? cols
        : [
            {
              field: 'rowIndex',
              headerName: '',
              width: 30,
              headerClassName: 'home-page-table-header',
              sortable: false,
              renderCell: (params: GridRenderCellParams) => {
                return (
                  <Typography
                    variant="body1"
                    height="100%"
                    display="flex"
                    alignItems="center"
                  >
                    {params.value + 1}
                  </Typography>
                );
              },
            },
            ...cols,
          ];
    },
    [isMobile]
  );

  const handleColumnOptions = useCallback(
    (cols: GridColDef<T>[]) => {
      let colsWithOptions = cols;
      if (isRowIdx) {
        colsWithOptions = handleRowOrderNum(colsWithOptions);
      }
      if (pinnedColumnName) {
        colsWithOptions = handlePinnedColOption(colsWithOptions);
      }

      return colsWithOptions;
    },
    [handlePinnedColOption, handleRowOrderNum, isRowIdx, pinnedColumnName]
  );

  const handleSortModelChange = useCallback(
    (_model: GridSortModel, details: GridCallbackDetails) => {
      apiRef.current.applySorting();
      const sortedRows = details.api.getSortedRows();
      sortedRows.forEach((row, index) => {
        apiRef.current.updateRows([{ ...row, rowIndex: index }]);
      });
    },
    [apiRef]
  );

  const pinnedColSx = {
    '& .pinned-column--header': {
      position: 'sticky',
      left: 0,
      zIndex: 1000,
      transform: 'translateZ(0)',
    },
    '& .pinned-column--cell': {
      position: 'sticky',
      left: 0,
      zIndex: 1000,
      background: '#fff',
      transform: 'translateZ(0)',
      borderRight: isMobile ? '1px solid rgb(224, 224, 224)' : '',
    },
  };

  const customizedColumns: GridColDef<T>[] = useMemo(
    () => handleColumnOptions(columns),
    [columns, handleColumnOptions]
  );

  return {
    customizedColumns,
    handleSortModelChange,
    pinnedColSx,
  };
}
