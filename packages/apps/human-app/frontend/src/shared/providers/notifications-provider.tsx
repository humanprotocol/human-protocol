import { type ReactNode } from 'react';
import { SnackbarProvider } from 'notistack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';

import { TopNotificationType } from '@/shared/hooks/use-notification';
import { handleUnreachableCase } from '@/shared/helpers/handle-unreachable-case';
import { useIsMobile } from '@/shared/hooks/use-is-mobile';

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
      return <CheckCircleIcon sx={{ color: 'white', ...sx }} />;
    case TopNotificationType.WARNING:
      return <WarningIcon sx={{ color: 'white', ...sx }} />;
    case TopNotificationType.ERROR:
      return <ErrorIcon sx={{ color: 'white', ...sx }} />;

    default: {
      handleUnreachableCase(type);
    }
  }
};

export function NotificationProvider({
  children,
  maxSnacks = MAX_NOTIFICATIONS_VISIBLE,
}: NotificationProviderProps) {
  const isMobile = useIsMobile();

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
      style={{
        minWidth: isMobile ? '90vw' : '80vw',
      }}
    >
      {children}
    </SnackbarProvider>
  );
}
