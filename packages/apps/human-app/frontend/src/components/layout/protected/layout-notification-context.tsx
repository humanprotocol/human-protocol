import { createContext } from 'react';
import type { TopNotificationType } from '@/components/ui/top-notification';

export interface TopNotificationPayload {
  content: string;
  type: TopNotificationType;
}

export type SetTopNotificationFn = (data: TopNotificationPayload) => void;

export const ProtectedLayoutContext = createContext<{
  setTopNotification: SetTopNotificationFn;
  closeNotification: () => void;
} | null>(null);
