import { t } from 'i18next';
import { useNotification } from '@/shared/hooks/use-notification';
import { getErrorMessageForError } from '@/shared/errors';
import type { ResponseError } from '@/shared/types/global.type';

export function useRegisterAddressNotifications() {
  const { showNotification } = useNotification();

  const onSuccess = () => {
    showNotification({
      type: 'success',
      message: t('worker.registerAddress.success'),
    });
  };
  const onError = (error: ResponseError) => {
    showNotification({
      type: 'warning',
      message: getErrorMessageForError(error),
      duration: 5000,
    });
  };

  return { onSuccess, onError };
}
