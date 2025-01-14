import { EmailVerificationProcess } from '@/modules/worker/components/email-verification/email-verification-process';
import { useVerificationToken } from '@/modules/worker/hooks/use-verification-token';
import { PageCardLoader } from '@/shared/components/ui/page-card';

export function WorkerEmailVerificationProcessPage() {
  const { token, isLoading } = useVerificationToken();

  if (isLoading || !token) {
    return <PageCardLoader />;
  }

  return <EmailVerificationProcess token={token} />;
}
