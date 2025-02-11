import { ChainId } from '@human-protocol/sdk';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import { Box, Button, Typography, useTheme } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { SUPPORTED_CHAIN_IDS } from '../../constants/chains';
import { useKVStoreContext } from '../../contexts/kvstore';
import { useSnackbar } from '../../providers/SnackProvider';
import KVStoreModal from '../modals/KVStoreModal';

const KVStoreTable: React.FC = () => {
  const { kvStore, set, setBulk } = useKVStoreContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const theme = useTheme();
  const { chainId } = useAccount();
  const { showError } = useSnackbar();
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
        marginBottom: 3,
        padding: 3,
        backgroundColor: theme.palette.white.main,
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
        }}
      >
        <DataGrid
          rows={filteredData}
          columns={columns}
          getRowId={(row) => row.key}
          getRowHeight={() => (filteredData.length > 0 ? 'auto' : null)}
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          disableColumnSelector
          disableRowSelectionOnClick
          disableColumnMenu
          hideFooterPagination={filteredData.length === 0}
          sx={{
            border: 0,
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
              '&:hover': {
                background: 'rgba(20, 6, 178, 0.04)',
              },
            },
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-cell:focus-within': {
              outline: 'none',
            },
            '& .MuiDataGrid-columnHeaders': {
              background: 'rgba(20, 6, 178, 0.04)',
              color: '#333',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              textTransform: 'uppercase',
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid #E0E0E0',
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
            '&, [class^=MuiDataGrid]': { border: 'none' },
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
      <Typography
        variant="body2"
        color="textSecondary"
        sx={{
          mt: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
      >
        <InfoIcon fontSize="small" />
        Please note: The data displayed is fetched from the subgraph and may
        take some time to update. As a result, the table might temporarily show
        outdated information.
      </Typography>
    </Box>
  );
};

export default KVStoreTable;
