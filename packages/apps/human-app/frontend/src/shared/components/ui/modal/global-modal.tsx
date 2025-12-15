import { DialogContent, IconButton, Dialog } from '@mui/material';
import { useModal } from '../../../contexts/modal-context';
import CloseIcon from '@mui/icons-material/Close';

export function GlobalModal() {
  const { open, closeModal, showCloseButton, content, onTransitionExited } =
    useModal();

  return (
    <Dialog
      open={open}
      onClose={closeModal}
      onTransitionExited={onTransitionExited}
      PaperProps={{
        sx: {
          flex: 1,
          maxWidth: '800px',
          position: 'relative',
        },
      }}
    >
      {showCloseButton && (
        <IconButton
          data-testid="button-close-modal"
          aria-label="close"
          onClick={closeModal}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            p: 0,
          }}
        >
          <CloseIcon />
        </IconButton>
      )}
      <DialogContent sx={{ py: 4, px: { xs: 2, md: 4 } }}>
        {content}
      </DialogContent>
    </Dialog>
  );
}
