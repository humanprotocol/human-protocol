import { useTranslation } from 'react-i18next';
import { useWorkerProfileStatus } from '../hooks';
import { StartKycBtn } from './buttons';
import { DoneLabel, ErrorLabel } from './status-labels';

export function KycVerificationControl() {
  const { t } = useTranslation();
  const { kycApproved, kycDeclined, kycToComplete } = useWorkerProfileStatus();

  return (
    <>
      {kycApproved && <DoneLabel>{t('worker.profile.kycCompleted')}</DoneLabel>}
      {kycDeclined && (
        <ErrorLabel>{t('worker.profile.kycDeclined')}</ErrorLabel>
      )}
      {kycToComplete && <StartKycBtn />}
    </>
  );
}
