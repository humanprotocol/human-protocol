import { t } from 'i18next';
import { useProtectedLayoutNotification } from '@/modules/worker/hooks/use-protected-layout-notifications';
import { getErrorMessageForError } from '@/shared/errors';
import { delay } from '@/shared/helpers/time';
import type { ResponseError } from '@/shared/types/global.type';

export function useHCaptchaLabelingNotifications() {
  const { setTopNotification, closeNotification } =
    useProtectedLayoutNotification();

  const onSuccess = async () => {
    setTopNotification({
      type: 'success',
      content: t('worker.hcaptchaLabelingStats.solvedSuccess'),
    });

    await delay(2000);
    closeNotification();
  };
  const onError = async (error: ResponseError) => {
    setTopNotification({
      type: 'warning',
      content: getErrorMessageForError(error),
    });

    await delay(2000);
    closeNotification();
  };

  return { onSuccess, onError };
}
