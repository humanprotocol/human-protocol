import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import MuiAlert from '@mui/material/Alert';
import type { AlertProps as MuiAlertProps } from '@mui/material/Alert';
import { Typography } from '@mui/material';
import { useColorMode } from '@/hooks/use-color-mode';
import { darkColorPalette } from '@/styles/dark-color-palette';

const getIcon = (severity: MuiAlertProps['severity'], isDarkMode: boolean) => {
  switch (severity) {
    case 'success':
      return (
        <CheckCircleIcon sx={isDarkMode ? { fill: 'white' } : undefined} />
      );

    case 'error':
      return <ErrorIcon sx={isDarkMode ? { fill: 'white' } : undefined} />;

    case 'warning':
      return <WarningIcon sx={isDarkMode ? { fill: 'white' } : undefined} />;

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
  const { colorPalette, isDarkMode } = useColorMode();
  const icon = getIcon(severity, isDarkMode);
  const fontColor = (() => {
    if (isDarkMode) {
      return 'white';
    }
    return color === 'error' ? colorPalette.error.main : 'inherit';
  })();

  const sxForDarkMode = {
    backgroundColor: (() => {
      switch (color) {
        case 'error':
          return darkColorPalette.error.main;

        case 'success':
          return darkColorPalette.success.main;
      }
    })(),
  };

  return (
    <MuiAlert
      color={color}
      icon={icon}
      {...rest}
      sx={isDarkMode ? sxForDarkMode : undefined}
      variant="standard"
    >
      <Typography sx={{ color: `${fontColor} !important` }} variant="subtitle2">
        {children}
      </Typography>
    </MuiAlert>
  );
}
