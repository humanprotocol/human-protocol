import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

export const verifyEmailDtoSchema = z.object({
  token: z.string(),
});

export type VerifyDto = z.infer<typeof verifyEmailDtoSchema>;

const VerifyEmailSuccessResponseSchema = z.unknown();

async function verifyEmailMutationFn(data: VerifyDto) {
  return apiClient(apiPaths.worker.verifyEmail.path, {
    successSchema: VerifyEmailSuccessResponseSchema,
    options: { method: 'POST', body: JSON.stringify(data) },
  });
}

export function useVerifyEmailMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyEmailMutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
