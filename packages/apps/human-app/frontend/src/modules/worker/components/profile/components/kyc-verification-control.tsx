import { useTranslation } from 'react-i18next';
import { DoneLabel } from '@/modules/worker/components/profile/components/status-labels/done-label';
import { ErrorLabel } from '@/modules/worker/components/profile/components/status-labels/error-label';
import { StartKycBtn } from '@/modules/worker/components/profile/components/buttons/start-kyc-btn';
import type { WorkerProfileStatus } from '@/modules/worker/components/profile/types/profile-types';

interface KycStatusProps {
  status: Pick<
    WorkerProfileStatus,
    'kycApproved' | 'kycDeclined' | 'kycToComplete'
  >;
}

export function KycVerificationControl({ status }: KycStatusProps) {
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
