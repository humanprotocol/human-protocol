import { useNotification } from '@/shared/hooks/use-notification';
import { getErrorMessageForError } from '@/shared/errors';
import type { ResponseError } from '@/shared/types/global.type';

export function useKycErrorNotifications() {
  const { showNotification } = useNotification();

  return (error: ResponseError) => {
    showNotification({
      type: 'warning',
      message: getErrorMessageForError(error),
      duration: 5000,
    });
  };
}
