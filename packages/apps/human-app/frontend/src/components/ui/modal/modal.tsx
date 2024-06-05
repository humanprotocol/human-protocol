import DialogMui from '@mui/material/Dialog';
import type { DialogProps as DialogMuiProps } from '@mui/material/Dialog';
import { DialogContent } from '@mui/material';

interface ModalProps extends Omit<DialogMuiProps, 'open'> {
  isOpen: boolean;
}

export function Modal({ children, isOpen, ...rest }: ModalProps) {
  return (
    <DialogMui
      {...rest}
      aria-describedby="modal-modal-description"
      aria-labelledby="modal-modal-title"
      fullWidth
      maxWidth="xl"
      open={isOpen}
    >
      <DialogContent>{children}</DialogContent>
    </DialogMui>
  );
}
