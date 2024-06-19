import { t } from 'i18next';
import { useProtectedLayoutNotification } from '@/hooks/use-protected-layout-notifications';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { wait } from '@/shared/helpers/wait';
import type { ResponseError } from '@/shared/types/global.type';

export function useHCaptchaLabelingNotifications() {
  const { setTopNotification, closeNotification } =
    useProtectedLayoutNotification();

  const onSuccess = async () => {
    setTopNotification({
      type: 'success',
      content: t('worker.hcaptchaLabelingStats.solvedSuccess'),
    });

    await wait(2000);
    closeNotification();
  };
  const onError = async (error: ResponseError) => {
    setTopNotification({
      type: 'warning',
      content: defaultErrorMessage(error),
    });

    await wait(2000);
    closeNotification();
  };

  return { onSuccess, onError };
}
