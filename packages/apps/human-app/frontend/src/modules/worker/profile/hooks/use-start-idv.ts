import { useEffect, useState, useCallback } from 'react';
import { ApiClientError } from '@/api';
import { useIdvStartMutation } from './use-start-idv-mutation';
import { TopNotificationType, useNotification } from '@/shared/hooks';
import { getErrorMessageForError } from '@/shared/errors';

export function useStartIdv() {
  const [isIdvAlreadyInProgress, setIsIdvAlreadyInProgress] = useState(false);

  const { showNotification } = useNotification();
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
      showNotification({
        type: TopNotificationType.WARNING,
        message: getErrorMessageForError(idvStartMutationError),
        durationMs: 5000,
      });
    }

    if (idvStarted && idvStartData.url) {
      window.location.href = idvStartData.url;
    }
  }, [
    idvStartData?.url,
    idvStartFailed,
    idvStarted,
    idvStartMutationError,
    showNotification,
  ]);

  return {
    isIdvAlreadyInProgress,
    idvStartIsPending,
    startIdv,
  };
}
