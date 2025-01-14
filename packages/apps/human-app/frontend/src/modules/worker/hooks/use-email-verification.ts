import { useVerifyEmailQuery } from '@/modules/worker/services/email-verification';
import { getErrorMessageForError } from '@/shared/errors';

export function useEmailVerification(token: string) {
  const {
    error: emailVerificationError,
    isError: isEmailVerificationError,
    isPending: isEmailVerificationPending,
  } = useVerifyEmailQuery({ token });

  return {
    error: emailVerificationError
      ? getErrorMessageForError(emailVerificationError)
      : null,
    isError: isEmailVerificationError,
    isPending: isEmailVerificationPending,
  };
}
