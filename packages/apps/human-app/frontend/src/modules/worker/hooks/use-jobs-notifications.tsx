import { t } from 'i18next';
import { useProtectedLayoutNotification } from '@/modules/worker/hooks/use-protected-layout-notifications';
import { getErrorMessageForError } from '@/shared/errors';
import { delay } from '@/shared/helpers/time';

export const useJobsNotifications = () => {
  const { setTopNotification, closeNotification } =
    useProtectedLayoutNotification();

  const onJobAssignmentSuccess = async () => {
    setTopNotification({
      content: t('worker.jobs.successFullyAssignedJob'),
      type: 'success',
    });
    await delay(5000);
    closeNotification();
  };

  const onJobAssignmentError = async (error: unknown) => {
    setTopNotification({
      content: getErrorMessageForError(error),
      type: 'warning',
    });
    await delay(5000);
    closeNotification();
  };

  return { onJobAssignmentSuccess, onJobAssignmentError };
};
