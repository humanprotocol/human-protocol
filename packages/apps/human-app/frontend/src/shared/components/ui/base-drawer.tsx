import { useCallback, type PropsWithChildren } from 'react';
import { Drawer, IconButton, type SxProps, type Theme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

type Props = {
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
  sx?: SxProps<Theme>;
  closeButtonSx?: SxProps<Theme>;
};

export function BaseDrawer({
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
    <Drawer
      open={open}
      onClose={handleClose}
      anchor="bottom"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer,
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(7px)',
            background: 'rgba(0, 0, 0, 0.3)',
          },
        },
        paper: {
          elevation: 0,
          sx: {
            py: 2,
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            border: 'none',
            height: '75dvh',
            ...sx,
          },
        },
      }}
    >
      <IconButton
        onClick={handleClose}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          p: 0.5,
          ...closeButtonSx,
        }}
      >
        <CloseIcon sx={{ color: 'neutral.100' }} />
      </IconButton>
      {children}
    </Drawer>
  );
}
