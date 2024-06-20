import { useProtectedLayoutNotification } from '@/hooks/use-protected-layout-notifications';
import { defaultErrorMessage } from '@/shared/helpers/default-error-message';
import type { ResponseError } from '@/shared/types/global.type';

export function useKycNotifications() {
  const { setTopNotification } = useProtectedLayoutNotification();

  return {
    onError: (error: ResponseError) => {
      setTopNotification({
        type: 'warning',
        content: defaultErrorMessage(error),
      });
    },
  };
}
