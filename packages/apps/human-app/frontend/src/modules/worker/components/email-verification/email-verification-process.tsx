import { useEmailVerification } from '@/modules/worker/hooks/use-email-verification';
import {
  PageCardError,
  PageCardLoader,
} from '@/shared/components/ui/page-card';
import { EmailVerificationSuccessMessage } from './email-verification-success-message';

interface EmailVerificationProcessProps {
  token: string;
}

export function EmailVerificationProcess({
  token,
}: Readonly<EmailVerificationProcessProps>) {
  const { error, isError, isPending } = useEmailVerification(token);

  if (isError && error) {
    return <PageCardError errorMessage={error} />;
  }

  if (isPending) {
    return <PageCardLoader />;
  }

  return <EmailVerificationSuccessMessage />;
}
