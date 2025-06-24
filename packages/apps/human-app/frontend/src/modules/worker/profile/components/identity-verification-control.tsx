import { useTranslation } from 'react-i18next';
import { useWorkerIdentityVerificationStatus } from '../hooks';
import { StartIdvBtn } from './buttons';
import { DoneLabel, ErrorLabel } from './status-labels';

export function IdentityVerificationControl() {
  const { t } = useTranslation();
  const { status } = useWorkerIdentityVerificationStatus();

  if (status === 'approved') {
    return (
      <DoneLabel>{t('worker.profile.identityVerificationStatus')}</DoneLabel>
    );
  } else if (status === 'declined') {
    return (
      <ErrorLabel>{t('worker.profile.identityVerificationStatus')}</ErrorLabel>
    );
  }

  return <StartIdvBtn />;
}
