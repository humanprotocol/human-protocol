import { useEffect, useState, useCallback } from 'react';
import { useIdvErrorNotifications } from '@/modules/worker/hooks/use-idv-notification';
import { ApiClientError } from '@/api';
import { useIdvStartMutation } from './use-start-idv-mutation';

export function useStartIdv() {
  const [isIdvAlreadyInProgress, setIsIdvAlreadyInProgress] = useState(false);
  const onError = useIdvErrorNotifications();
  const {
    data: idvStartData,
    isPending: idvStartIsPending,
    isSuccess: idvStarted,
    isError: idvStartFailed,
    mutate: idvStartMutation,
    error: idvStartMutationError,
  } = useIdvStartMutation();

  const startIdv = useCallback(() => {
    idvStartMutation();
  }, [idvStartMutation]);

  useEffect(() => {
    if (idvStartFailed) {
      if (
        idvStartMutationError instanceof ApiClientError &&
        idvStartMutationError.status === 400
      ) {
        setIsIdvAlreadyInProgress(true);
        return;
      }
      onError(idvStartMutationError);
    }

    if (idvStarted && idvStartData.url) {
      window.location.href = idvStartData.url;
    }
  }, [
    idvStartData?.url,
    idvStartFailed,
    idvStarted,
    idvStartMutationError,
    onError,
  ]);

  return {
    isIdvAlreadyInProgress,
    idvStartIsPending,
    startIdv,
  };
}
