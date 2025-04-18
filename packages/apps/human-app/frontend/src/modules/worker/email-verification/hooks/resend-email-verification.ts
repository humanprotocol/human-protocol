import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { type ResendEmailVerificationDto } from '../schemas';
import { emailVerificationService } from '../services/email-verification.service';

export const ResendEmailVerificationSuccessResponseSchema = z.unknown();

async function resendEmailVerificationMutationFn(
  _data: ResendEmailVerificationDto,
  isAuthenticated: boolean,
  userEmail: string | undefined
) {
  if (!isAuthenticated) {
    throw new Error(t('worker.verifyEmail.authError'));
  }

  if (!userEmail) {
    throw new Error(t('worker.verifyEmail.emailError'));
  }

  return emailVerificationService.resendEmailVerification(
    _data.h_captcha_token,
    userEmail
  );
}

const resendEmailVerificationKey = 'resendEmailVerification';

export function useResendEmailVerificationWorkerMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (dto: ResendEmailVerificationDto) =>
      resendEmailVerificationMutationFn(dto, Boolean(user), user?.email),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
    mutationKey: [resendEmailVerificationKey],
  });
}
