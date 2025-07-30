import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as jobsService from '../../services/jobs.service';
import { type RefreshJobsBody } from '../../types';

export const refreshTasksSchema = z.unknown();

export function useRefreshJobsMutation(callbacks?: {
  onSuccess?: () => Promise<void>;
  onError?: (error: unknown) => Promise<void>;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RefreshJobsBody) => jobsService.refreshJobs(data),
    onSuccess: async () => {
      if (callbacks?.onSuccess) {
        void callbacks.onSuccess();
      }
      await queryClient.invalidateQueries({ queryKey: ['fetchMyJobs'] });
    },
    onError: (error) => {
      if (callbacks?.onError) {
        void callbacks.onError(error);
      }
    },
  });
}
