import { useTranslation } from 'react-i18next';
import { DoneLabel } from '@/modules/worker/components/profile/components/status-labels/done-label';
import { ErrorLabel } from '@/modules/worker/components/profile/components/status-labels/error-label';
import { StartKycButton } from '@/modules/worker/components/profile/components/buttons/start-kyc-btn';
import type { ProfileStatus } from '@/modules/worker/components/profile/types/profile-types';

interface KycStatusProps {
  status: Pick<ProfileStatus, 'kycApproved' | 'kycDeclined' | 'kycToComplete'>;
}

export function KycStatus({ status }: KycStatusProps) {
  const { t } = useTranslation();

  if (status.kycApproved) {
    return <DoneLabel>{t('worker.profile.kycCompleted')}</DoneLabel>;
  }

  if (status.kycDeclined) {
    return <ErrorLabel>{t('worker.profile.kycDeclined')}</ErrorLabel>;
  }

  return <StartKycButton />;
}
