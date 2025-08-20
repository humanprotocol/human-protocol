import { z } from 'zod';
import { type MutationKey, useMutation } from '@tanstack/react-query';
import * as jobsService from '../../services/jobs.service';
import { type AssignJobBody } from '../../types';

export const AssignJobBodySuccessResponseSchema = z.unknown();

export function useAssignJobMutation(
  callbacks?: {
    onSuccess: () => void;
    onError: (error: Error) => void;
  },
  mutationKey?: MutationKey
) {
  return useMutation({
    mutationFn: async (data: AssignJobBody) => jobsService.assignJob(data),
    onSuccess: () => {
      callbacks?.onSuccess();
    },
    onError: (error) => {
      callbacks?.onError(error);
    },
    mutationKey,
  });
}
