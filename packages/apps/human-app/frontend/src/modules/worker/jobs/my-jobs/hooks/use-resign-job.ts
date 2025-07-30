import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import * as jobsService from '../../services/jobs.service';
import { type RejectTaskBody } from '../../types';

export const rejectTaskSchema = z.unknown();

export function useResignJobMutation(callbacks?: {
  onSuccess?: () => Promise<void>;
  onError?: (error: unknown) => Promise<void>;
}) {
  return useMutation({
    mutationFn: async (data: RejectTaskBody) => jobsService.resignJob(data),
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
