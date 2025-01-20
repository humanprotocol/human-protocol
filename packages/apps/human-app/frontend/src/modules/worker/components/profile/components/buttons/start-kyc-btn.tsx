import { t } from 'i18next';
import { Button } from '@/shared/components/ui/button';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useStartKyc } from '@/modules/worker/components/profile/hooks/use-start-kyc';

export function StartKycBtn() {
  const { user } = useAuthenticatedUser();
  const { isKYCInProgress, kycStartIsPending, startKYC } = useStartKyc();

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
