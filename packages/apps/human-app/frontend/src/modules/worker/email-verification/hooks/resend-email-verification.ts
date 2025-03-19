import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { type ResendEmailVerificationDto } from '../schemas';

const ResendEmailVerificationSuccessResponseSchema = z.unknown();

async function resendEmailVerificationMutationFn(
  data: ResendEmailVerificationDto,
  isAuthenticated: boolean
) {
  if (!isAuthenticated) {
    throw new Error(t('worker.verifyEmail.authError'));
  }

  return apiClient(apiPaths.worker.resendEmailVerification.path, {
    authenticated: true,
    withAuthRetry: apiPaths.worker.resendEmailVerification.withAuthRetry,
    successSchema: ResendEmailVerificationSuccessResponseSchema,
    options: { method: 'POST', body: JSON.stringify(data) },
  });
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
