import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { type ResendEmailVerificationDto } from '../schemas';
import * as emailVerificationService from '../services/email-verification.service';

async function resendEmailVerificationMutationFn(
  _data: ResendEmailVerificationDto,
  isAuthenticated: boolean
) {
  if (!isAuthenticated) {
    throw new Error(t('worker.verifyEmail.authError'));
  }

  return emailVerificationService.resendEmailVerification(
    _data.h_captcha_token
  );
}

const resendEmailVerificationKey = 'resendEmailVerification';

export function useResendEmailVerificationWorkerMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (dto: ResendEmailVerificationDto) =>
      resendEmailVerificationMutationFn(dto, Boolean(user)),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
    mutationKey: [resendEmailVerificationKey],
  });
}
