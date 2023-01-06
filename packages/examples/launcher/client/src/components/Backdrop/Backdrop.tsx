import * as React from 'react';
import { Backdrop as MuiBackdrop, Box, CircularProgress } from '@mui/material';

export const Backdrop = ({ open, handleClose }: any) => {
  return (
    <Box>
      <MuiBackdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={open}
        onClick={handleClose}
      >
        <CircularProgress color="inherit" />
      </MuiBackdrop>
    </Box>
  );
};
