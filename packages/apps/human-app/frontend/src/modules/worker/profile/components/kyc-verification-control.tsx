import { useTranslation } from 'react-i18next';
import { useWorkerKycStatus } from '../hooks';
import { StartKycBtn } from './buttons';
import { DoneLabel, ErrorLabel } from './status-labels';

export function KycVerificationControl() {
  const { t } = useTranslation();
  const { kycApproved, kycDeclined, kycToComplete } = useWorkerKycStatus();

  return (
    <>
      {kycApproved && (
        <DoneLabel>{t('worker.profile.identityVerificationStatus')}</DoneLabel>
      )}
      {kycDeclined && (
        <ErrorLabel>
          {t('worker.profile.identityVerificationStatus')}
        </ErrorLabel>
      )}
      {kycToComplete && <StartKycBtn />}
    </>
  );
}
