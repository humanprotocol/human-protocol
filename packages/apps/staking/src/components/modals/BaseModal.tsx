import { FC, PropsWithChildren } from 'react';
import { Modal, Box, IconButton, SxProps, Theme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

type Props = {
  open: boolean;
  onClose: () => void;
  sx?: SxProps<Theme>;
};

const BaseModal: FC<PropsWithChildren<Props>> = ({
  open,
  onClose,
  children,
  sx,
}) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(240, 242, 252, 0.90)',
          },
        },
      }}
    >
      <Box
        sx={{
          py: 5,
          px: 4,
          width: 500,
          backgroundColor: '#ffffff',
          borderRadius: 4,
          position: 'relative',
          boxShadow: '0px 0px 10px 0px rgba(50, 10, 141, 0.05)',
          ...sx,
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            p: 0,
            position: 'absolute',
            top: '40px',
            right: '32px',
            '&:hover': {
              bgcolor: 'unset',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
        {children}
      </Box>
    </Modal>
  );
};

export default BaseModal;
