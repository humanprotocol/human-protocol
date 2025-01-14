import { useProtectedLayoutNotification } from '@/modules/worker/hooks/use-protected-layout-notifications';
import { getErrorMessageForError } from '@/shared/errors';
import type { ResponseError } from '@/shared/types/global.type';

export function useKycErrorNotifications() {
  const { setTopNotification } = useProtectedLayoutNotification();

  return (error: ResponseError) => {
    setTopNotification({
      type: 'warning',
      content: getErrorMessageForError(error),
    });
  };
}
