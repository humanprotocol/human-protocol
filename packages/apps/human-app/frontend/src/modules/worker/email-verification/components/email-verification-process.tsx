import {
  PageCardError,
  PageCardLoader,
} from '@/shared/components/ui/page-card';
import { getErrorMessageForError } from '@/shared/errors';
import { useVerifyEmailMutation } from '../hooks';
import { EmailVerificationSuccessMessage } from './email-verification-success-message';

interface EmailVerificationProcessProps {
  token: string;
}

function useEmailVerification(token: string) {
  const { error, isError, isPending } = useVerifyEmailMutation({ token });

  return {
    error,
    isError,
    isPending,
  };
}

export function EmailVerificationProcess({
  token,
}: Readonly<EmailVerificationProcessProps>) {
  const { error, isError, isPending } = useEmailVerification(token);

  if (isError) {
    return <PageCardError errorMessage={getErrorMessageForError(error)} />;
  }

  if (isPending) {
    return <PageCardLoader />;
  }

  return <EmailVerificationSuccessMessage />;
}
