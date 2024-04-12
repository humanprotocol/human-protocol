import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import MuiAlert from '@mui/material/Alert';
import type { AlertProps as MuiAlertProps } from '@mui/material/Alert';
import { Typography } from '@mui/material';
import { colorPalette } from '@/styles/color-palette';

const getIcon = (color: AlertProps['color']) => {
  switch (color) {
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

type AlertProps = MuiAlertProps & {
  closeIcon?: boolean;
};

export function Alert({
  color,
  children,
  closeIcon,
  onClose,
  ...rest
}: AlertProps) {
  const icon = getIcon(color);
  const fontColor = color === 'error' ? colorPalette.error.main : 'inherit';
  return (
    <MuiAlert
      color={color}
      icon={icon}
      {...rest}
      onClose={
        closeIcon || onClose
          ? (e) => {
              if (onClose) {
                onClose(e);
              }
            }
          : undefined
      }
      variant="standard"
    >
      <Typography color={fontColor} variant="subtitle2">
        {children}
      </Typography>
    </MuiAlert>
  );
}
