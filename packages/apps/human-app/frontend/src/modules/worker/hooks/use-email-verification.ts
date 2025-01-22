import { useVerifyEmailQuery } from '@/modules/worker/services/email-verification';
import { getErrorMessageForError } from '@/shared/errors';

export function useEmailVerification(token: string) {
  const {
    error: emailVerificationError,
    isError: isEmailVerificationError,
    isPending: isEmailVerificationPending,
  } = useVerifyEmailQuery({ token });

  return {
    errorMsg: emailVerificationError
      ? getErrorMessageForError(emailVerificationError)
      : null,
    isEmailVerificationError,
    isEmailVerificationPending,
  };
}
