import CheckIcon from '@mui/icons-material/CheckCircle';
import { Loader } from '@/shared/components/ui/loader';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Cancel';

export function ModalLoading() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="fit-content"
      mx="auto"
    >
      <Loader size={40} />
    </Box>
  );
}

export function ModalSuccess({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="fit-content"
        mx="auto"
      >
        <CheckIcon sx={{ width: 40, height: 40, color: 'success.main' }} />
      </Box>
      {children}
    </>
  );
}

export function ModalError({ message }: { message: string }) {
  return (
    <>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="fit-content"
        mx="auto"
      >
        <CloseIcon sx={{ width: 40, height: 40, color: 'error.main' }} />
      </Box>
      <Typography variant="body2" color="error.main" textAlign="center">
        {message}
      </Typography>
    </>
  );
}
