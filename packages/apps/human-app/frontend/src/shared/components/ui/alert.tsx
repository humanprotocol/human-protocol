import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import {
  Alert as MuiAlert,
  type AlertProps as MuiAlertProps,
  Typography,
} from '@mui/material';

import { useColorMode } from '@/shared/contexts/color-mode';

const getIcon = (severity: MuiAlertProps['severity'], isDarkMode: boolean) => {
  const iconSx = {
    ...(isDarkMode ? { fill: 'white' } : null),
  };

  switch (severity) {
    case 'success':
      return <CheckCircleIcon sx={iconSx} />;
    case 'error':
      return <ErrorIcon sx={iconSx} />;
    case 'warning':
      return <WarningIcon sx={iconSx} />;
    default:
      return undefined;
  }
};

export function Alert({
  severity,
  color,
  children,
  ...rest
}: Omit<MuiAlertProps, 'color'> & { color: 'success' | 'error' }) {
  const { isDarkMode } = useColorMode();

  const icon = getIcon(severity, isDarkMode);

  return (
    <MuiAlert
      variant="standard"
      color={color}
      icon={icon}
      {...rest}
      sx={{
        bgcolor: (theme) =>
          isDarkMode ? theme.palette[color].main : undefined,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          color: isDarkMode
            ? 'white'
            : color === 'error'
              ? 'error.main'
              : 'inherit',
        }}
      >
        {children}
      </Typography>
    </MuiAlert>
  );
}
