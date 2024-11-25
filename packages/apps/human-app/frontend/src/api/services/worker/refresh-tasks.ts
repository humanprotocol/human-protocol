import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

function refreshTasks(data: { oracle_address: string }) {
  return apiClient(apiPaths.worker.refreshJob.path, {
    successSchema: z.unknown(),
    authenticated: true,
    options: { method: 'PUT', body: JSON.stringify(data) },
  });
}

export function useRefreshTasksMutation(callbacks?: {
  onSuccess?: () => Promise<void>;
  onError?: (error: unknown) => Promise<void>;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refreshTasks,
    onSuccess: async () => {
      if (callbacks?.onSuccess) {
        void callbacks.onSuccess();
      }
      await queryClient.invalidateQueries();
    },
    onError: async (error) => {
      if (callbacks?.onError) {
        void callbacks.onError(error);
      }
      await queryClient.invalidateQueries();
    },
  });
}
