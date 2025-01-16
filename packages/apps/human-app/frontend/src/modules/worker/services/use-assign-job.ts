import { z } from 'zod';
import {
  type MutationKey,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

export interface AssignJobBody {
  escrow_address: string;
  chain_id: number;
}

const AssignJobBodySuccessResponseSchema = z.unknown();

function assignJob(data: AssignJobBody) {
  return apiClient(apiPaths.worker.assignJob.path, {
    authenticated: true,
    successSchema: AssignJobBodySuccessResponseSchema,
    options: { method: 'POST', body: JSON.stringify(data) },
  });
}

export function useAssignJobMutation(
  callbacks?: {
    onSuccess: () => void;
    onError: (error: unknown) => void;
  },
  mutationKey?: MutationKey
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignJob,
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
