import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

function rejectTask(data: { assignment_id: string; oracle_address: string }) {
  return apiClient(apiPaths.worker.resignJob.path, {
    successSchema: z.unknown(),
    authenticated: true,
    options: { method: 'POST', body: JSON.stringify(data) },
  });
}

export function useRejectTaskMutation(callbacks?: {
  onSuccess?: () => Promise<void>;
  onError?: (error: unknown) => Promise<void>;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectTask,
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
