import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { useAccessTokenRefresh } from '@/api/hooks/use-access-token-refresh';

const kycStartSchema = z.object({
  url: z.string(),
});

export type KycStartSuccessSchema = z.infer<typeof kycStartSchema>;

export function useKycStartMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuthenticatedUser();
  const { refreshAccessTokenAsync } = useAccessTokenRefresh();
  return useMutation({
    mutationFn: async () => {
      try {
        const result = await apiClient(apiPaths.worker.kycStart.path, {
          successSchema: kycStartSchema,
          authenticated: true,
          withAuthRetry: apiPaths.worker.kycStart.withAuthRetry,
          options: {
            method: 'POST',
          },
        });
        return result;
      } catch (error) {
        await refreshAccessTokenAsync({ authType: 'web2' });
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
