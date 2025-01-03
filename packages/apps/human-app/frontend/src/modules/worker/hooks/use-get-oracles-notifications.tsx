import { useProtectedLayoutNotification } from '@/modules/worker/hooks/use-protected-layout-notifications';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import { wait } from '@/shared/helpers/wait';
import type { ResponseError } from '@/shared/types/global.type';

export function useGetOraclesNotifications() {
  const { setTopNotification, closeNotification } =
    useProtectedLayoutNotification();

  const onError = async (error: ResponseError) => {
    setTopNotification({
      type: 'warning',
      content: defaultErrorMessage(error),
    });
    await wait(5000);
    closeNotification();
  };

  return { onError };
}
