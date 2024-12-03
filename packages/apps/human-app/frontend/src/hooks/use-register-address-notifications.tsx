import { useProtectedLayoutNotification } from '@/hooks/use-protected-layout-notifications';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
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
      content: defaultErrorMessage(error),
    });
  };

  return { onSuccess, onError };
}
