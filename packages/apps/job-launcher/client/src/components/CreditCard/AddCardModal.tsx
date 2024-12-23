import CloseIcon from '@mui/icons-material/Close';
import { Box, Dialog, IconButton, Typography, useTheme } from '@mui/material';
import { CardSetupForm } from './CardSetupForm';

const AddCardModal = ({
  open,
  onClose,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}) => {
  const theme = useTheme();

  const handleCardAdded = () => {
    onComplete();
    onClose();
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
            Add Credit Card Details
          </Typography>
          <Typography color="text.secondary" variant="caption">
            We need you to add a credit card in order to comply with HUMAN’s
            Abuse Mechanism. Learn more about it here.
            <br />
            <br />
            This card will be used for funding the jobs requested.
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
          <Box width="100%" display="flex" flexDirection="column" gap={3}>
            <CardSetupForm onComplete={handleCardAdded} />
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

export default AddCardModal;
