import { useProtectedLayoutNotification } from '@/modules/worker/hooks/use-protected-layout-notifications';
import { getErrorMessageForError } from '@/shared/errors';
import { delay } from '@/shared/helpers/time';
import type { ResponseError } from '@/shared/types/global.type';

export function useGetOraclesNotifications() {
  const { setTopNotification, closeNotification } =
    useProtectedLayoutNotification();

  const onError = async (error: ResponseError) => {
    setTopNotification({
      type: 'warning',
      content: getErrorMessageForError(error),
    });
    await delay(5000);
    closeNotification();
  };

  return { onError };
}
