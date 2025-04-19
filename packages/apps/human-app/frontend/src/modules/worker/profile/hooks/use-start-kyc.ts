import { useEffect, useState, useCallback } from 'react';
import { useKycErrorNotifications } from '@/modules/worker/hooks/use-kyc-notification';
import { ApiClientError } from '@/api';
import { useKycStartMutation } from './use-start-kyc-mutation';

export function useStartKyc() {
  const [isKYCInProgress, setIsKYCInProgress] = useState(false);
  const onError = useKycErrorNotifications();
  const {
    data: kycStartData,
    isPending: kycStartIsPending,
    mutate: kycStartMutation,
    status: kycStartMutationStatus,
    error: kycStartMutationError,
  } = useKycStartMutation();

  const startKYC = useCallback(() => {
    kycStartMutation();
  }, [kycStartMutation]);

  useEffect(() => {
    if (kycStartMutationStatus === 'error') {
      if (
        kycStartMutationError instanceof ApiClientError &&
        kycStartMutationError.status === 400
      ) {
        setIsKYCInProgress(true);
        return;
      }
      onError(kycStartMutationError);
    }

    if (kycStartMutationStatus === 'success' && kycStartData.url) {
      window.location.href = kycStartData.url;
    }
  }, [
    kycStartData?.url,
    kycStartMutationError,
    kycStartMutationStatus,
    onError,
  ]);

  return {
    isKYCInProgress,
    kycStartIsPending,
    startKYC,
  };
}
