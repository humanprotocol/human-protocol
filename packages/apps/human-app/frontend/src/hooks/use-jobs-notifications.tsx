import { t } from 'i18next';
import { useProtectedLayoutNotification } from '@/hooks/use-protected-layout-notifications';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { wait } from '@/shared/helpers/wait';

export const useJobsNotifications = () => {
  const { setTopNotification, closeNotification } =
    useProtectedLayoutNotification();

  const onJobAssignmentSuccess = async () => {
    setTopNotification({
      content: t('worker.jobs.successFullyAssignedJob'),
      type: 'success',
    });
    await wait(5000);
    closeNotification();
  };

  const onJobAssignmentError = async (error: unknown) => {
    setTopNotification({
      content: defaultErrorMessage(error),
      type: 'warning',
    });
    await wait(5000);
    closeNotification();
  };

  return { onJobAssignmentSuccess, onJobAssignmentError };
};
