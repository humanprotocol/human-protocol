import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { AlertProps } from '@mui/material/Alert';
import MuiAlert from '@mui/material/Alert';

const getIcon = (color: AlertProps['color']) => {
  switch (color) {
    case 'success':
      return <CheckCircleOutlineIcon />;

    case 'error':
      return <ErrorOutlineIcon />;

    case 'warning':
      return <WarningAmberIcon />;

    case 'info':
      return <InfoOutlinedIcon />;

    default:
      return <CheckCircleOutlineIcon />;
  }
};

export function Alert({ color, ...rest }: AlertProps) {
  return <MuiAlert color={color} icon={getIcon(color)} {...rest} />;
}
