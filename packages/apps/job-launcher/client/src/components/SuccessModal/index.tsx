import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Dialog,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';

const SuccessModal = ({
  open,
  onClose,
  message,
}: {
  open: boolean;
  onClose: () => void;
  message: string;
}) => {
  const theme = useTheme();

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
            Success!
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

          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            mb={4}
          >
            <CheckCircleIcon
              sx={{
                fontSize: '80px',
                color: 'green',
              }}
            />
          </Box>

          <Typography mb={4}>{message}</Typography>

          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            onClick={onClose}
          >
            Continue
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default SuccessModal;
