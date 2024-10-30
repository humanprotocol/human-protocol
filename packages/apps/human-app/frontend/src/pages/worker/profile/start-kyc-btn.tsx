import { t } from 'i18next';
import { useEffect, useState } from 'react';
import { useKycStartMutation } from '@/api/services/worker/get-kyc-session-id';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';
import { Button } from '@/components/ui/button';
import { useKycErrorNotifications } from '@/hooks/use-kyc-notification';
import { FetchError } from '@/api/fetcher';

export function StartKycButton() {
  const [isKYCInProgress, setIsKYCInProgress] = useState(false);
  const { user } = useAuthenticatedUser();
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

  if (isKYCInProgress) {
    return (
      <Button disabled fullWidth variant="contained">
        {t('worker.profile.KYCInProgress')}
      </Button>
    );
  }

  return (
    <Button
      disabled={user.status !== 'active'}
      fullWidth
      loading={kycStartIsPending}
      onClick={startKYC}
      variant="contained"
    >
      {t('worker.profile.completeKYC')}
    </Button>
  );
}
