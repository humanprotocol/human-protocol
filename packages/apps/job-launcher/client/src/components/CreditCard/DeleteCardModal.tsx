import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {
  Box,
  Button,
  Dialog,
  IconButton,
  Typography,
  useTheme,
  Alert,
} from '@mui/material';
import { useState } from 'react';
import { useSnackbar } from '../../providers/SnackProvider';
import { deleteUserCard } from '../../services/payment';

const DeleteCardModal = ({
  open,
  onClose,
  cardId,
  isDefault = false,
  hasMultipleCards = false,
  onSuccess,
  openAddCreditCardModal,
}: {
  open: boolean;
  onClose: () => void;
  cardId: string;
  isDefault?: boolean;
  hasMultipleCards?: boolean;
  onSuccess: () => void;
  openAddCreditCardModal: (open: boolean) => void;
}) => {
  const theme = useTheme();
  const { showError } = useSnackbar();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Para manejar el error del backend

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await deleteUserCard(cardId);
      onSuccess();
    } catch (error: any) {
      if (
        error.response?.status === 400 &&
        error.response?.data?.message ===
          'Cannot delete the default payment method in use'
      ) {
        setError(
          'The credit card you’re trying to remove is currently in use to prevent potential misuse in your most recently launched job.',
        );
      } else {
        showError('Error deleting card');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{ sx: { mx: 2, maxWidth: 'calc(100% - 32px)' } }}
    >
      <Box display="flex" maxWidth="950px">
        <Box
          width={{ xs: '0', md: '40%' }}
          display={{ xs: 'none', md: 'flex' }}
          sx={{
            background: theme.palette.primary.main,
            boxSizing: 'border-box',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
          px={9}
          py={6}
        >
          <Typography variant="h4" fontWeight={600} color="#fff">
            Delete Credit Card?
          </Typography>
        </Box>

        <Box
          sx={{ boxSizing: 'border-box' }}
          width={{ xs: '100%', md: '60%' }}
          minWidth={{ xs: '340px', sm: '392px' }}
          display="flex"
          flexDirection="column"
          p={{ xs: 2, sm: 4 }}
        >
          <IconButton sx={{ ml: 'auto' }} onClick={onClose}>
            <CloseIcon color="primary" />
          </IconButton>

          {error ? (
            <Box mt={2}>
              <Typography mb={4}>{error}</Typography>
              <Typography mb={4}>
                To proceed with the removal, please:
              </Typography>
              <ul>
                <li>
                  Wait 24 hours while we verify that your dataset does not
                  contain abusive content.
                </li>
                <li>
                  Alternatively, set a different card as your default payment
                  method.
                </li>
              </ul>
              <Box display="flex" gap={1} mt={4}>
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={() => {
                    onClose();
                  }}
                >
                  Cancel
                </Button>
                &nbsp;
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={() => {
                    onClose();
                    openAddCreditCardModal(true);
                  }}
                >
                  + Add a Credit Card
                </Button>
              </Box>
            </Box>
          ) : (
            <>
              {isDefault && hasMultipleCards ? (
                <Box mt={2}>
                  <Alert severity="error" icon={<ErrorOutlineIcon />}>
                    <Typography fontWeight={600}>
                      This credit card is set as default!
                    </Typography>
                  </Alert>
                  <Typography mb={4} mt={4}>
                    This card can only be deleted if you choose another card as
                    default.
                  </Typography>
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      size="large"
                      fullWidth
                      onClick={() => {
                        onClose();
                      }}
                    >
                      Cancel
                    </Button>
                    &nbsp;
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={() => {
                        onClose();
                        openAddCreditCardModal(true);
                      }}
                    >
                      + Add a Credit Card
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box mt={2}>
                  <Typography mb={4}>
                    Are you sure you want to delete this credit card from your
                    account?
                  </Typography>
                  <Box display="flex" gap={2}>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="large"
                      fullWidth
                      onClick={onClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      size="large"
                      fullWidth
                      onClick={handleDelete}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Deleting...' : 'Delete Credit Card'}
                    </Button>
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Dialog>
  );
};

export default DeleteCardModal;
