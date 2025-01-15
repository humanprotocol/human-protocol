import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';
import { getErrorMessageForError } from '@/shared/errors';
import type { ResponseError } from '@/shared/types/global.type';

export function useKycErrorNotifications() {
  const { showNotification } = useNotification();

  return (error: ResponseError) => {
    showNotification({
      type: TopNotificationType.WARNING,
      message: getErrorMessageForError(error),
      durationMs: 5000,
    });
  };
}
