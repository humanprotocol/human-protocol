import { t } from 'i18next';
import { Button } from '@/shared/components/ui/button';
import { useStartKyc } from '../../hooks';

export function StartKycBtn() {
  const { isKYCInProgress, kycStartIsPending, startKYC } = useStartKyc();

  if (isKYCInProgress) {
    return (
      <Button disabled fullWidth variant="contained">
        {t('worker.profile.identityVerificationInProgress')}
      </Button>
    );
  }

  return (
    <Button
      fullWidth
      loading={kycStartIsPending}
      onClick={startKYC}
      variant="contained"
    >
      {t('worker.profile.completeIdentityVerification')}
    </Button>
  );
}
