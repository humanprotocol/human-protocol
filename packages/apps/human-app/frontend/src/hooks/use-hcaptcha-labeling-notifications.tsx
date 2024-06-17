import { t } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { useProtectedLayoutNotification } from '@/hooks/use-protected-layout-notifications';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { wait } from '@/shared/helpers/wait';
import type { ResponseError } from '@/shared/types/global.type';

export function useHCaptchaLabelingNotifications() {
  const { setTopNotification } = useProtectedLayoutNotification();
  const navigate = useNavigate();

  const onSuccess = async () => {
    setTopNotification({
      type: 'success',
      content: t('worker.hcaptchaLabelingStats.solvedSuccess'),
    });

    await wait(2000);
    navigate(0);
  };
  const onError = async (error: ResponseError) => {
    setTopNotification({
      type: 'warning',
      content: defaultErrorMessage(error),
    });

    await wait(2000);
    navigate(0);
  };

  return { onSuccess, onError };
}
