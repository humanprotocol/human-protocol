import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MuiAlert from '@mui/material/Alert';
import type { AlertProps } from '@mui/material/Alert';
import { Typography } from '@mui/material';
import { colorPalette } from '@/styles/color-palette';

const getIcon = (color: AlertProps['color']) => {
  switch (color) {
    case 'success':
      return <CheckCircleOutlineIcon color="action" />;

    case 'error':
      return <ErrorOutlineIcon color="action" />;

    case 'warning':
      return <WarningAmberIcon color="action" />;

    case 'info':
      return <InfoOutlinedIcon color="action" />;

    default:
      return undefined;
  }
};

export function Alert({ color, children, onClose, ...rest }: AlertProps) {
  const icon = getIcon(color);

  if (!icon) {
    return <MuiAlert color={color} {...rest} />;
  }

  return (
    <MuiAlert
      color={color}
      icon={icon}
      {...rest}
      onClose={(e) => {
        if (onClose) {
          onClose(e);
        }
      }}
    >
      <Typography sx={{ color: colorPalette.white }} variant="subtitle2">
        {children}
      </Typography>
    </MuiAlert>
  );
}
