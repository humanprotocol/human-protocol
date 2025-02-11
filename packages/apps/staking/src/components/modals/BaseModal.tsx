import React from 'react';
import { Modal, Box, IconButton, SxProps, Theme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
};

const BaseModal: React.FC<Props> = ({ open, onClose, children, sx }) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          p: 4,
          width: 500,
          mx: 'auto',
          mt: 20,
          backgroundColor: '#fff',
          borderRadius: 2,
          position: 'relative',
          ...sx,
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <CloseIcon />
        </IconButton>
        {children}
      </Box>
    </Modal>
  );
};

export default BaseModal;
