export type TopNotificationType = 'success' | 'warning';

export interface ShowNotifProps {
  message: string;
  type: TopNotificationType;
  duration?: number;
}
