import { t } from 'i18next';
import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';
import { getErrorMessageForError } from '@/shared/errors';
import type { ResponseError } from '@/shared/types/global.type';

export function useHCaptchaLabelingNotifications() {
  const { showNotification } = useNotification();

  const onSuccess = () => {
    showNotification({
      type: TopNotificationType.SUCCESS,
      message: t('worker.hcaptchaLabelingStats.solvedSuccess'),
      durationMs: 2000,
    });
  };
  const onError = (error: ResponseError) => {
    showNotification({
      type: TopNotificationType.WARNING,
      message: getErrorMessageForError(error),
      durationMs: 5000,
    });
  };

  return { onSuccess, onError };
}
