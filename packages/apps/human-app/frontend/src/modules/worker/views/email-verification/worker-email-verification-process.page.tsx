import { PageCardLoader } from '@/shared/components/ui/page-card-loader';
import { EmailVerificationProcess } from '@/modules/worker/components/email-verification/email-verification-process';
import { useEmailVerificationToken } from '@/modules/worker/hooks/use-email-verification-token';

export function WorkerEmailVerificationProcessPage() {
  const { token, isLoading } = useEmailVerificationToken();

  if (isLoading || !token) {
    return <PageCardLoader />;
  }

  return <EmailVerificationProcess token={token} />;
}
