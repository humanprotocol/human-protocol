import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import * as jobsService from '../../services/jobs.service';
import { type RefreshJobsBody } from '../../types';

export const refreshTasksSchema = z.unknown();

export function useRefreshJobsMutation(callbacks?: {
  onSuccess?: () => Promise<void>;
  onError?: (error: unknown) => Promise<void>;
}) {
  return useMutation({
    mutationFn: async (data: RefreshJobsBody) => jobsService.refreshJobs(data),
    onSuccess: () => {
      if (callbacks?.onSuccess) {
        void callbacks.onSuccess();
      }
    },
    onError: (error) => {
      if (callbacks?.onError) {
        void callbacks.onError(error);
      }
    },
  });
}
