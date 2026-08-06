import { useMutation } from '@tanstack/react-query';

import * as emailVerificationService from '../services/email-verification.service';

export function useVerifyEmailMutation({ token }: { token: string }) {
  return useMutation({
    mutationFn: () => emailVerificationService.verifyEmail(token),
  });
}
