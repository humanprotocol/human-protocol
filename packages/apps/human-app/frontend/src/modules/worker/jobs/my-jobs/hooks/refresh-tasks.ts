import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsService, type RefreshJobsBody } from '../../services/jobs.service';

export const refreshTasksSchema = z.unknown();

export function useRefreshTasksMutation(callbacks?: {
  onSuccess?: () => Promise<void>;
  onError?: (error: unknown) => Promise<void>;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RefreshJobsBody) => {
      return jobsService.refreshJobs(data);
    },
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
