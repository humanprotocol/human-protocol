import { useEmailVerification } from '@/modules/worker/hooks/use-email-verification';
import {
  PageCardError,
  PageCardLoader,
} from '@/shared/components/ui/page-card';
import { getErrorMessageForError } from '@/shared/errors';
import { EmailVerificationSuccessMessage } from './email-verification-success-message';

interface EmailVerificationProcessProps {
  token: string;
}

export function EmailVerificationProcess({
  token,
}: Readonly<EmailVerificationProcessProps>) {
  const { errorMsg, isEmailVerificationError, isEmailVerificationPending } =
    useEmailVerification(token);

  if (isEmailVerificationError && errorMsg !== null) {
    return <PageCardError errorMessage={getErrorMessageForError(errorMsg)} />;
  }

  if (isEmailVerificationPending) {
    return <PageCardLoader />;
  }

  return <EmailVerificationSuccessMessage />;
}
