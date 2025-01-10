import { type ReactNode } from 'react';
import { SnackbarProvider } from 'notistack';
import { getNotificationIconByType } from '@/shared/helpers/get-notification-icon-by-type';

interface NotificationProviderProps {
  children: ReactNode;
  maxSnacks?: number;
}

const MAX_NOTIFICATIONS_VISIBLE = 5;

export function NotificationProvider({
  children,
  maxSnacks = MAX_NOTIFICATIONS_VISIBLE,
}: NotificationProviderProps) {
  return (
    <SnackbarProvider
      maxSnack={maxSnacks}
      preventDuplicate
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
