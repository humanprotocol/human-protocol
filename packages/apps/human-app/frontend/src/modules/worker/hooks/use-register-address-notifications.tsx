import { useProtectedLayoutNotification } from '@/modules/worker/hooks/use-protected-layout-notifications';
import { getErrorMessageForError } from '@/shared/errors';
import type { ResponseError } from '@/shared/types/global.type';

export function useRegisterAddressNotifications() {
  const { setTopNotification, closeNotification } =
    useProtectedLayoutNotification();

  const onSuccess = () => {
    closeNotification();
  };
  const onError = (error: ResponseError) => {
    setTopNotification({
      type: 'warning',
      content: getErrorMessageForError(error),
    });
  };

  return { onSuccess, onError };
}
