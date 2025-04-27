import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import * as emailVerificationService from '../services/email-verification.service';

export const verifyEmailDtoSchema = z.object({
  token: z.string(),
});

export const VerifyEmailSuccessResponseSchema = z.unknown();

export function useVerifyEmailMutation({ token }: { token: string }) {
  return useMutation({
    mutationFn: () => emailVerificationService.verifyEmail(token),
    mutationKey: ['verify-email', token],
  });
}
