import { Box, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

import { LeaderBoardData } from '@/services/api/use-leaderboard-details';
import { handleErrorMessage } from '@/services/handle-error-message';
import Loader from '@/shared/ui/Loader';
import { useIsMobile } from '@/utils/hooks/use-breakpoints';

import useDataGrid from '../hooks/useDataGrid';

export const DataGridWrapper = ({
  data = [],
  status,
  error,
}: {
  data: LeaderBoardData | undefined;
  status: 'success' | 'error' | 'pending';
  error: unknown;
}) => {
  const { columns, rows } = useDataGrid(data);
  const isMobile = useIsMobile();

  const tableIsEmpty = status === 'success' && rows.length === 0;
  const tableMinHeight = status === 'success' && !tableIsEmpty ? 'unset' : 300;

  return (
    <Box width="100%" height={tableMinHeight} sx={{ overflow: 'hidden' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        rowHeight={90}
        columnHeaderHeight={72}
        scrollbarSize={0}
        disableColumnResize
        disableColumnMenu
        disableColumnSelector
        disableRowSelectionOnClick
        disableColumnSorting
        disableVirtualization={isMobile}
        hideFooter
        hideFooterPagination
        getRowSpacing={() => ({
          top: 4,
          bottom: 0,
        })}
        loading={status === 'pending'}
        slots={{
          noRowsOverlay() {
            if (status === 'error') {
              return <div>{handleErrorMessage(error)}</div>;
            }

            return (
              <Box
                height="100%"
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                <Typography>No data</Typography>
              </Box>
            );
          },
          loadingOverlay() {
            return <Loader height="30vh" />;
          },
        }}
        sx={{
          position: 'relative',
          border: 0,
          mb: 2,
          '& .MuiDataGrid-cell': {
            borderTop: 'none',
            p: 2,
            overflow: 'visible !important',
          },
          '& .MuiDataGrid-row:hover': {
            background: 'rgba(20, 6, 178, 0.04)',
          },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
            outline: 'none',
          },
          '& .MuiDataGrid-columnSeparator--sideRight': {
            display: 'none',
          },
          '& .MuiDataGrid-columnHeader': {
            fontSize: '12px',
            p: 2,
            overflow: 'visible !important',
            textTransform: 'uppercase',
            bgcolor: 'white.light',
          },
          '& .MuiDataGrid-row--borderBottom .MuiDataGrid-withBorderColor': {
            borderColor: 'transparent',
          },
          '& .MuiDataGrid-overlayWrapper': {
            height: '100%',
          },
          '& .MuiDataGrid-columnHeaderTitleContainerContent ': {
            overflow: 'visible',
          },
          '& .MuiDataGrid-columnHeaderTitleContainer': {
            overflow: 'unset',
            whiteSpace: 'normal',
          },
          '& .MuiDataGrid-columnHeader:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-virtualScroller': {
            position: 'relative',
          },
          '& .MuiDataGrid-filler, & .MuiDataGrid-cellEmpty': {
            display: 'none',
          },
        }}
      />
    </Box>
  );
};
