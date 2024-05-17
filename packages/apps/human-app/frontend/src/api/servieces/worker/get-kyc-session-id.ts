import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

const kycSessionIdSchema = z.object({
  id: z.string(),
});

export type KycSessionIdSuccessSchema = z.infer<typeof kycSessionIdSchema>;

const getKycSessionId = () => {
  return apiClient(apiPaths.worker.kycSessionId.path, {
    authenticated: true,
    successSchema: kycSessionIdSchema,
    options: { method: 'GET' },
  });
};

export function useKycSessionIdMutation() {
  const { user } = useAuthenticatedUser();

  return useMutation({
    mutationFn: getKycSessionId,
    mutationKey: ['kycSessionId', user.email],
  });
}
