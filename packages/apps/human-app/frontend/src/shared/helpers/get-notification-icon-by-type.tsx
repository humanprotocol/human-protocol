import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { type TopNotificationType } from '@/shared/types/notifications';
import { colorPalette as lightColorPalette } from '@/shared/styles/color-palette';

export const getNotificationIconByType = (
  type: TopNotificationType,
  sx?: Record<string, string>
) => {
  switch (type) {
    case 'success':
      return <CheckCircleIcon sx={{ fill: lightColorPalette.white, ...sx }} />;

    case 'warning':
      return <ErrorIcon sx={{ fill: lightColorPalette.white, ...sx }} />;
  }
};
