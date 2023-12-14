import { Alert as MuiAlert, AlertProps } from '@mui/material';
import { forwardRef } from 'react';

export const Alert = forwardRef<HTMLDivElement, AlertProps>((props, ref) => {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
