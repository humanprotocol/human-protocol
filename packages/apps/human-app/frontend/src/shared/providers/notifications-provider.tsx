import { type ReactNode } from 'react';
import { SnackbarProvider } from 'notistack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { type TopNotificationType } from '@/shared/hooks/use-notification';
import { colorPalette as lightColorPalette } from '@/shared/styles/color-palette';
import { exhaustiveMatchingGuard } from '@/shared/helpers/exhaustive-matching-guard';

interface NotificationProviderProps {
  children: ReactNode;
  maxSnacks?: number;
}

const MAX_NOTIFICATIONS_VISIBLE = 5;

const getNotificationIconByType = (
  type: TopNotificationType,
  sx?: Record<string, string>
) => {
  switch (type) {
    case 'success':
      return <CheckCircleIcon sx={{ fill: lightColorPalette.white, ...sx }} />;

    case 'warning':
      return <ErrorIcon sx={{ fill: lightColorPalette.white, ...sx }} />;

    default: {
      exhaustiveMatchingGuard(type);
    }
  }
};

export function NotificationProvider({
  children,
  maxSnacks = MAX_NOTIFICATIONS_VISIBLE,
}: NotificationProviderProps) {
  return (
    <SnackbarProvider
      maxSnack={maxSnacks}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      iconVariant={{
        success: getNotificationIconByType('success', { marginRight: '12px' }),
        warning: getNotificationIconByType('warning', { marginRight: '12px' }),
      }}
    >
      {children}
    </SnackbarProvider>
  );
}
