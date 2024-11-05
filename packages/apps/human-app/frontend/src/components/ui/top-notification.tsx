import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MuiAlert from '@mui/material/Alert';
import type { AlertProps as MuiAlertProps } from '@mui/material/Alert';
import { Typography } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import { breakpoints } from '@/styles/breakpoints';
import { useColorMode } from '@/hooks/use-color-mode';
import { colorPalette as lightColorPalette } from '@/styles/color-palette';

export type TopNotificationType = 'success' | 'warning';

const getIcon = (type: TopNotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircleIcon sx={{ fill: lightColorPalette.white }} />;

    case 'warning':
      return <ErrorIcon sx={{ fill: lightColorPalette.white }} />;
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
  const { colorPalette } = useColorMode();

  const icon = getIcon(type);
  const backgroundColor =
    type === 'success'
      ? colorPalette.success.main
      : colorPalette.secondary.main;
  const fontColor = lightColorPalette.white;

  return (
    <MuiAlert
      icon={icon}
      {...rest}
      sx={{
        backgroundColor,
        color: fontColor,
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        [breakpoints.mobile]: {
          margin: '1rem',
        },
      }}
      variant="standard"
    >
      <Typography color={fontColor} variant="subtitle2">
        {children}
      </Typography>
    </MuiAlert>
  );
}
