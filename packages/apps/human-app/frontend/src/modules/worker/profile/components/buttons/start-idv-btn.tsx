import { t } from 'i18next';
import { Button } from '@/shared/components/ui/button';
import { useStartIdv } from '../../hooks';

export function StartIdvBtn() {
  const { isIdvAlreadyInProgress, idvStartIsPending, startIdv } = useStartIdv();

  if (isIdvAlreadyInProgress) {
    return (
      <Button disabled fullWidth variant="contained">
        {t('worker.profile.identityVerificationInProgress')}
      </Button>
    );
  }

  return (
    <Button
      fullWidth
      loading={idvStartIsPending}
      onClick={startIdv}
      variant="contained"
    >
      {t('worker.profile.completeIdentityVerification')}
    </Button>
  );
}
