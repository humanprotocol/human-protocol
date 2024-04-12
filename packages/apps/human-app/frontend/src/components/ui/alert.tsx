import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import MuiAlert from '@mui/material/Alert';
import type { AlertProps as MuiAlertProps } from '@mui/material/Alert';
import { Typography } from '@mui/material';
import { colorPalette } from '@/styles/color-palette';

const getIcon = (severity: MuiAlertProps['severity']) => {
  switch (severity) {
    case 'success':
      return <CheckCircleIcon />;

    case 'error':
      return <ErrorIcon />;

    case 'warning':
      return <WarningIcon />;

    default:
      return undefined;
  }
};

export function Alert({ severity, color, children, ...rest }: MuiAlertProps) {
  const icon = getIcon(severity);
  const fontColor = color === 'error' ? colorPalette.error.main : 'inherit';
  return (
    <MuiAlert color={color} icon={icon} {...rest} variant="standard">
      <Typography color={fontColor} variant="subtitle2">
        {children}
      </Typography>
    </MuiAlert>
  );
}
