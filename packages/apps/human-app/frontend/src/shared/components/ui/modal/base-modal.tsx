import { type PropsWithChildren, useCallback } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import {
  IconButton,
  Modal,
  Paper,
  type SxProps,
  type Theme,
} from '@mui/material';

type Props = {
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
  sx?: SxProps<Theme>;
  closeButtonSx?: SxProps<Theme>;
};

export function BaseModal({
  open,
  onClose,
  isLoading = false,
  sx,
  closeButtonSx,
  children,
}: PropsWithChildren<Props>) {
  const handleClose = useCallback(() => {
    if (isLoading) return;
    onClose();
  }, [isLoading, onClose]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mx: 0,
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(7px)',
            background: 'rgba(0, 0, 0, 0.3)',
          },
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          flexShrink: 0,
          py: 4,
          px: 4,
          width: 640,
          maxHeight: '700px',
          overflowY: 'hidden',
          borderRadius: '20px',
          position: 'relative',
          boxShadow: 'none',
          bgcolor: 'background.paper',
          ...sx,
        }}
      >
        <IconButton
          disabled={isLoading}
          onClick={handleClose}
          sx={{
            p: 0.5,
            color: 'text.auxiliary100',
            position: 'absolute',
            top: 32,
            right: 32,
            '&:hover': {
              bgcolor: 'unset',
            },
            ...closeButtonSx,
          }}
        >
          <CloseIcon />
        </IconButton>
        {children}
      </Paper>
    </Modal>
  );
}
