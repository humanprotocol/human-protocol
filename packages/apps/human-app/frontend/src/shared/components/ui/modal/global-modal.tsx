import { DialogContent } from '@mui/material';
import DialogMui from '@mui/material/Dialog';
import { useModal } from '../../../contexts/modal-context';
import { ModalHeader } from './modal-header';

export function GlobalModal() {
  const { open, closeModal, showCloseButton, content } = useModal();

  return (
    <DialogMui open={open} onClose={closeModal}>
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
