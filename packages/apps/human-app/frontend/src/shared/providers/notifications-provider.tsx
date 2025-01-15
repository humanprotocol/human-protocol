import { type ReactNode } from 'react';
import { SnackbarProvider } from 'notistack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { TopNotificationType } from '@/shared/hooks/use-notification';
import { colorPalette as lightColorPalette } from '@/shared/styles/color-palette';
import { handleUnreachableCase } from '@/shared/helpers/handle-unreachable-case';

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
    case TopNotificationType.SUCCESS:
      return <CheckCircleIcon sx={{ fill: lightColorPalette.white, ...sx }} />;

    case TopNotificationType.WARNING:
      return <ErrorIcon sx={{ fill: lightColorPalette.white, ...sx }} />;

    default: {
      handleUnreachableCase(type);
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
        success: getNotificationIconByType(TopNotificationType.SUCCESS, {
          marginRight: '12px',
        }),
        warning: getNotificationIconByType(TopNotificationType.WARNING, {
          marginRight: '12px',
        }),
      }}
    >
      {children}
    </SnackbarProvider>
  );
}
