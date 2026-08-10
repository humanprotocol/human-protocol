import { type PropsWithChildren } from 'react';

import { type SxProps, type Theme } from '@mui/material';

import { BaseDrawer } from './base-drawer';
import { BaseModal } from './modal/base-modal';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

type Props = {
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
  desktopSx?: SxProps<Theme>;
  mobileSx?: SxProps<Theme>;
  closeButtonSx?: SxProps<Theme>;
};

export function ResponsiveOverlay({
  open,
  onClose,
  isLoading = false,
  desktopSx,
  mobileSx,
  closeButtonSx,
  children,
}: PropsWithChildren<Props>) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <BaseModal
        open={open}
        onClose={onClose}
        isLoading={isLoading}
        sx={desktopSx}
        closeButtonSx={closeButtonSx}
      >
        {children}
      </BaseModal>
    );
  }

  return (
    <BaseDrawer
      open={open}
      onClose={onClose}
      isLoading={isLoading}
      sx={mobileSx}
      closeButtonSx={closeButtonSx}
    >
      {children}
    </BaseDrawer>
  );
}
