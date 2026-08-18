import { CircularProgress, type CircularProgressProps } from '@mui/material';

export function Loader({ ...props }: CircularProgressProps) {
  return (
    <CircularProgress
      {...props}
      sx={{
        '.MuiCircularProgress-circle': {
          color: 'accent.main',
        },
      }}
    />
  );
}
