import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

export const resendEmailVErificationDtoSchema = z.object({
  email: z.string().email(),
});

export type ResendEmailVerificationDto = z.infer<
  typeof resendEmailVErificationDtoSchema
>;

const ResendEmailVerificationSuccessResponseSchema = z.unknown();

function resendEmailVerificationMutationFn(data: ResendEmailVerificationDto) {
  return apiClient(apiPaths.worker.resendEmailVerification.path, {
    authenticated: true,
    successSchema: ResendEmailVerificationSuccessResponseSchema,
    options: { method: 'POST', body: JSON.stringify(data) },
  });
}

export function useResendEmailVerificationWorkerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resendEmailVerificationMutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
