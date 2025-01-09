import { t } from 'i18next';
import { useNotification } from '@/shared/hooks/use-notification';
import { getErrorMessageForError } from '@/shared/errors';

export const useJobsNotifications = () => {
  const { showNotification } = useNotification();

  const onJobAssignmentSuccess = () => {
    showNotification({
      message: t('worker.jobs.successFullyAssignedJob'),
      type: 'success',
      duration: 5000,
    });
  };

  const onJobAssignmentError = (error: unknown) => {
    showNotification({
      message: getErrorMessageForError(error),
      type: 'warning',
      duration: 5000,
    });
  };

  return { onJobAssignmentSuccess, onJobAssignmentError };
};
