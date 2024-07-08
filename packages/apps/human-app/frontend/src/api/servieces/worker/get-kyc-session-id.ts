/* eslint-disable camelcase -- ...*/
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { useGetAccessTokenMutation } from '@/api/servieces/common/get-access-token';

const kycSessionIdSchema = z.object({
  session_id: z.string(),
});

export type KycSessionIdSuccessSchema = z.infer<typeof kycSessionIdSchema>;

export function useKycSessionIdMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuthenticatedUser();
  const { mutateAsync: getAccessTokenMutation } = useGetAccessTokenMutation();
  return useMutation({
    mutationFn: async () => {
      try {
        const result = await apiClient(apiPaths.worker.kycSessionId.path, {
          successSchema: kycSessionIdSchema,
          authenticated: true,
          options: {
            method: 'POST',
          },
        });
        return result;
      } catch (error) {
        await getAccessTokenMutation('web2');
        throw error;
      }
    },

    onError: () => {
      void queryClient.invalidateQueries();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
    mutationKey: ['kycSessionId', user.email],
  });
}
