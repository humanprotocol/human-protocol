import { t } from 'i18next';
import {
  TopNotificationType,
  useNotification,
} from '@/shared/hooks/use-notification';
import { getErrorMessageForError } from '@/shared/errors';

export const useJobsNotifications = () => {
  const { showNotification } = useNotification();

  const onJobAssignmentSuccess = () => {
    showNotification({
      message: t('worker.jobs.successFullyAssignedJob'),
      type: TopNotificationType.SUCCESS,
      durationMs: 5000,
    });
  };

  const onJobAssignmentError = (error: unknown) => {
    showNotification({
      message: getErrorMessageForError(error),
      type: TopNotificationType.WARNING,
      durationMs: 5000,
    });
  };

  return { onJobAssignmentSuccess, onJobAssignmentError };
};
