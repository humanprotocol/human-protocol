import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { useGetAccessTokenMutation } from '@/api/services/common/get-access-token';

const kycStartSchema = z.object({
  url: z.string(),
});

export type KycStartSuccessSchema = z.infer<typeof kycStartSchema>;

export function useKycStartMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuthenticatedUser();
  const { mutateAsync: getAccessTokenMutation } = useGetAccessTokenMutation();
  return useMutation({
    mutationFn: async () => {
      try {
        const result = await apiClient(apiPaths.worker.kycStart.path, {
          successSchema: kycStartSchema,
          authenticated: true,
          options: {
            method: 'POST',
          },
        });
        return result;
      } catch (error) {
        await getAccessTokenMutation({ authType: 'web2' });
        throw error;
      }
    },

    onError: () => {
      void queryClient.invalidateQueries();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
    mutationKey: ['kycStart', user.email],
  });
}
