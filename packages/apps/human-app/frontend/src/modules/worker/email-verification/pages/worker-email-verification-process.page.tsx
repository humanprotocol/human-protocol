import { PageCardLoader } from '@/shared/components/ui/page-card';
import { EmailVerificationProcess } from '../components';
import { useEmailVerificationToken } from '../hooks';

export function WorkerEmailVerificationProcessPage() {
  const { token, isLoading } = useEmailVerificationToken();

  if (isLoading || !token) {
    return <PageCardLoader />;
  }

  return <EmailVerificationProcess token={token} />;
}
