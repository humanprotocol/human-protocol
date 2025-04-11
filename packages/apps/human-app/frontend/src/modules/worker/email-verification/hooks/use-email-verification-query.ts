import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { emailVerificationService } from '../services/email-verification.service';

export const verifyEmailDtoSchema = z.object({
  token: z.string(),
});

export type VerifyDto = z.infer<typeof verifyEmailDtoSchema>;

export const VerifyEmailSuccessResponseSchema = z.unknown();

export function useVerifyEmailQuery({ token }: { token: string }) {
  return useQuery({
    queryFn: () => emailVerificationService.verifyEmail(token),
    queryKey: [token],
    refetchInterval: 0,
  });
}
