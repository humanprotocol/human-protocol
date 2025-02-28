import { useTranslation } from 'react-i18next';
import { PageCardError } from '@/shared/components/ui/page-card';
import { EmailVerificationProcess } from '../components';
import { useEmailVerificationToken } from '../hooks';

export function WorkerEmailVerificationProcessPage() {
  const { t } = useTranslation();
  const { token } = useEmailVerificationToken();

  if (!token) {
    return (
      <PageCardError
        errorMessage={t('worker.emailVerification.errors.noToken')}
      />
    );
  }

  return <EmailVerificationProcess token={token} />;
}
