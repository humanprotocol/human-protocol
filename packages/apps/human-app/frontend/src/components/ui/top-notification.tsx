import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MuiAlert from '@mui/material/Alert';
import type { AlertProps as MuiAlertProps } from '@mui/material/Alert';
import { Typography } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import { colorPalette } from '@/styles/color-palette';

export type TopNotificationType = 'success' | 'warning';

const getIcon = (type: TopNotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircleIcon sx={{ fill: colorPalette.white }} />;

    case 'warning':
      return <ErrorIcon sx={{ fill: colorPalette.white }} />;
  }
};

type TopNotificationProps = MuiAlertProps & {
  type: TopNotificationType;
};

export function TopNotification({
  children,
  type,
  ...rest
}: TopNotificationProps) {
  const icon = getIcon(type);
  const color =
    type === 'success' ? colorPalette.success.main : colorPalette.primary.light;
  return (
    <MuiAlert
      icon={icon}
      {...rest}
      sx={{ backgroundColor: color, color: colorPalette.white }}
      variant="standard"
    >
      <Typography color={colorPalette.white} variant="subtitle2">
        {children}
      </Typography>
    </MuiAlert>
  );
}
