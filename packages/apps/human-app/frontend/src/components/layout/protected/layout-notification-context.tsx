import { createContext } from 'react';
import type { TopNotificationType } from '@/components/ui/top-notification';

export interface TopNotificationPayload {
  content: string;
  type: TopNotificationType;
}

export const ProtectedLayoutContext = createContext<{
  setTopNotification: (data: TopNotificationPayload) => void;
  closeNotification: () => void;
} | null>(null);
