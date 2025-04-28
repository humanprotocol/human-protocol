import { FC, useState } from 'react';

import EditIcon from '@mui/icons-material/Edit';
import { Box, Button, Typography, useTheme } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useAccount } from 'wagmi';
import { ChainId } from '@human-protocol/sdk';

import { SUPPORTED_CHAIN_IDS } from '../../constants/chains';
import { useKVStoreContext } from '../../contexts/kvstore';
import { useSnackbar } from '../../providers/SnackProvider';
import KVStoreModal from '../modals/KVStoreModal';

const KVStoreTable: FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const theme = useTheme();
  const { chainId } = useAccount();
  const { showError } = useSnackbar();
  const { kvStore, set, setBulk, loading } = useKVStoreContext();

  const isDarkMode = theme.palette.mode === 'dark';
  const filteredData = kvStore.filter((item) => item.value !== '');

  const handleOpenModal = () => {
    if (!SUPPORTED_CHAIN_IDS.includes(chainId as ChainId)) {
      showError('Unsupported chain. Please switch to a supported network.');
      return;
    }
    setIsModalOpen(true);
  };

  const handleSaveChanges = async (keys: string[], values: string[]) => {
    try {
      if (keys.length === 1) {
        await set(keys[0], values[0]);
      } else {
        await setBulk(keys, values);
      }
    } catch (err) {
      console.error('Failed to update KVStore:', err);
      throw err;
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'key',
      headerName: 'Key',
      flex: 1,
      renderCell: (params) => (
        <Typography
          variant="body1"
          fontWeight={400}
          display="flex"
          alignItems="center"
          fontSize="1.1rem"
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'value',
      headerName: 'Value',
      flex: 2,
      renderCell: (params) => (
        <Typography
          variant="body1"
          fontWeight={400}
          display="flex"
          alignItems="center"
          fontSize="1.1rem"
        >
          {params.value}
        </Typography>
      ),
    },
  ];

  return (
    <Box
      sx={{
        width: '100%',
        padding: 4,
        background: isDarkMode
          ? theme.palette.elevation.medium
          : theme.palette.white.main,
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box flexGrow={1}>
        <DataGrid
          loading={loading}
          rows={filteredData}
          columns={columns}
          columnHeaderHeight={56}
          disableColumnSorting
          getRowId={(row) => row.key}
          getRowHeight={() => (filteredData.length > 0 ? 'auto' : null)}
          disableColumnSelector
          disableRowSelectionOnClick
          disableColumnMenu
          hideFooterPagination
          sx={{
            border: 0,
            '& .MuiDataGrid-main': {
              maxHeight: '500px',
            },
            '& .MuiDataGrid-cell': {
              borderTop: 'none',
              padding: '12px 16px',
              fontSize: '0.9rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            },
            '& .MuiDataGrid-row': {
              borderTop: 'none',
              borderBottom: '1px solid rgba(99, 9, 255, 0.08)',
              '&:hover': {
                background: 'rgba(20, 6, 178, 0.04)',
              },
            },
            '& .MuiDataGrid-row--lastVisible': {
              borderBottom: 'none',
            },
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-cell:focus-within': {
              outline: 'none',
            },
            '& .MuiDataGrid-columnHeader': {
              background: isDarkMode
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(20, 6, 178, 0.04)',
              padding: '16px',
              textTransform: 'uppercase',
              borderBottomWidth: '0px !important',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              color: theme.palette.primary.main,
              fontSize: '12px',
              fontWeight: 400,
              letterSpacing: '0.4px',
            },
            '& .MuiDataGrid-footerContainer': {
              border: 'none',
            },
            '& .MuiDataGrid-columnHeader:hover': {
              color: 'rgb(133, 142, 198)',
            },
            '& .MuiDataGrid-columnHeader:focus-within': {
              outline: 'none',
            },
            '& .MuiDataGrid-columnSeparator--sideRight': {
              display: 'none',
            },
            '& .MuiDataGrid-virtualScroller': {
              position: 'relative',
            },
            '& .MuiDataGrid-filler': {
              display: 'none',
            },
          }}
          slots={{
            noRowsOverlay: () => (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '180px',
                }}
              >
                <Typography variant="body1" fontWeight={500}>
                  No data available
                </Typography>
              </Box>
            ),
          }}
        />
      </Box>
      <Button
        variant="outlined"
        startIcon={<EditIcon />}
        size="large"
        fullWidth
        onClick={handleOpenModal}
      >
        Edit
      </Button>
      <KVStoreModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={filteredData}
        onSave={handleSaveChanges}
      />
    </Box>
  );
};

export default KVStoreTable;
