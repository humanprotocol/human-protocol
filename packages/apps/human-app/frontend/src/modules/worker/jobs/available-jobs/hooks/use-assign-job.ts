import { z } from 'zod';
import {
  type MutationKey,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { jobsService } from '../../services/jobs.service';
import { type AssignJobBody } from '../../types';

export const AssignJobBodySuccessResponseSchema = z.unknown();

export function useAssignJobMutation(
  callbacks?: {
    onSuccess: () => void;
    onError: (error: Error) => void;
  },
  mutationKey?: MutationKey
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AssignJobBody) => {
      return jobsService.assignJob(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      callbacks?.onSuccess();
    },
    onError: async (error) => {
      await queryClient.invalidateQueries();
      callbacks?.onError(error);
    },
    mutationKey,
  });
}
