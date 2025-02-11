import { useTranslation } from 'react-i18next';
import { type WorkerProfileStatus } from '../types/profile-types';
import { StartKycBtn } from './buttons';
import { DoneLabel, ErrorLabel } from './status-labels';

interface KycStatusProps {
  status: Pick<
    WorkerProfileStatus,
    'kycApproved' | 'kycDeclined' | 'kycToComplete'
  >;
}

export function KycVerificationControl({ status }: Readonly<KycStatusProps>) {
  const { t } = useTranslation();
  const kycToComplete = !(status.kycApproved || status.kycDeclined);

  return (
    <>
      {status.kycApproved && (
        <DoneLabel>{t('worker.profile.kycCompleted')}</DoneLabel>
      )}
      {status.kycDeclined && (
        <ErrorLabel>{t('worker.profile.kycDeclined')}</ErrorLabel>
      )}
      {kycToComplete && <StartKycBtn />}
    </>
  );
}
