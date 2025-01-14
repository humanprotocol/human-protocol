import { useNotification } from '@/shared/hooks/use-notification';
import { getErrorMessageForError } from '@/shared/errors';
import type { ResponseError } from '@/shared/types/global.type';

export function useGetOraclesNotifications() {
  const { showNotification } = useNotification();

  const onError = (error: ResponseError) => {
    showNotification({
      type: 'warning',
      message: getErrorMessageForError(error),
      durationMs: 5000,
    });
  };

  return { onError };
}
