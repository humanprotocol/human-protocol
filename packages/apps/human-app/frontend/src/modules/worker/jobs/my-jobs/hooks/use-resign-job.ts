import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as jobsService from '../../services/jobs.service';
import { type RejectTaskBody } from '../../types';

export const rejectTaskSchema = z.unknown();

export function useResignJobMutation(callbacks?: {
  onSuccess?: () => Promise<void>;
  onError?: (error: unknown) => Promise<void>;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RejectTaskBody) => jobsService.resignJob(data),
    onSuccess: async () => {
      if (callbacks?.onSuccess) {
        void callbacks.onSuccess();
      }
      await queryClient.invalidateQueries({ queryKey: ['fetchMyJobs'] });
      await queryClient.invalidateQueries({ queryKey: ['myJobsInfinite'] });
    },
    onError: (error) => {
      if (callbacks?.onError) {
        void callbacks.onError(error);
      }
    },
  });
}
