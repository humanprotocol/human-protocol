import { useEffect, useState } from 'react';
import { useKycStartMutation } from '@/modules/worker/services/get-kyc-session-id';
import { useKycErrorNotifications } from '@/modules/worker/hooks/use-kyc-notification';
import { FetchError } from '@/api/fetcher';

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

  const startKYC = () => {
    kycStartMutation();
  };

  useEffect(() => {
    if (kycStartMutationStatus === 'error') {
      if (
        kycStartMutationError instanceof FetchError &&
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
