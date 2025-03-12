import { useCallback } from 'react';
import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';
import { getErrorMessageForError } from '@/shared/errors';
import type { ResponseError } from '@/shared/types/global.type';

export function useGetOraclesNotifications() {
  const { showNotification } = useNotification();

  const onError = useCallback(
    (error: ResponseError) => {
      showNotification({
        type: TopNotificationType.WARNING,
        message: getErrorMessageForError(error),
        durationMs: 5000,
      });
    },
    [showNotification]
  );

  return { onError };
}
