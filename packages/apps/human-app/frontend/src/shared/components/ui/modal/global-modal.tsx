import { DialogContent } from '@mui/material';
import DialogMui from '@mui/material/Dialog';
import { useModal } from '../../../contexts/modal-context';
import { ModalHeader } from './modal-header';

export function GlobalModal() {
  const { open, closeModal, showCloseButton, content, onTransitionExited } =
    useModal();

  return (
    <DialogMui
      open={open}
      onClose={closeModal}
      onTransitionExited={onTransitionExited}
      PaperProps={{
        sx: {
          flex: 1,
        },
      }}
    >
      <ModalHeader
        closeButton={{
          isVisible: showCloseButton,
          onClick: closeModal,
        }}
      />
      <DialogContent>{content}</DialogContent>
    </DialogMui>
  );
}
