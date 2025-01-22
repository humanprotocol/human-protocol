import { PageCardError } from '@/shared/components/ui/page-card-error';
import { PageCardLoader } from '@/shared/components/ui/page-card-loader';
import { useEmailVerification } from '@/modules/worker/hooks/use-email-verification';
import { EmailVerificationSuccessMessage } from './email-verification-success-message';

interface EmailVerificationProcessProps {
  token: string;
}

export function EmailVerificationProcess({
  token,
}: EmailVerificationProcessProps) {
  const { errorMsg, isEmailVerificationError, isEmailVerificationPending } =
    useEmailVerification(token);

  if (isEmailVerificationError && errorMsg) {
    return <PageCardError errorMessage={errorMsg} />;
  }

  if (isEmailVerificationPending) {
    return <PageCardLoader />;
  }

  return <EmailVerificationSuccessMessage />;
}
