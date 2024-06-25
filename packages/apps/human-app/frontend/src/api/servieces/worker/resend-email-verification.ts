import { z } from 'zod';
import type { MutationState } from '@tanstack/react-query';
import {
  useMutation,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query';
import last from 'lodash/last';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import type { ResponseError } from '@/shared/types/global.type';

export const resendEmailVerificationDtoSchema = z.object({
  email: z.string().email(),
});

export type ResendEmailVerificationDto = z.infer<
  typeof resendEmailVerificationDtoSchema
>;

const ResendEmailVerificationSuccessResponseSchema = z.unknown();

async function resendEmailVerificationMutationFn(
  data: ResendEmailVerificationDto
) {
  return apiClient(apiPaths.worker.resendEmailVerification.path, {
    authenticated: true,
    successSchema: ResendEmailVerificationSuccessResponseSchema,
    options: { method: 'POST', body: JSON.stringify(data) },
  });
}

const resendEmailVerificationKey = 'resendEmailVerification';

export function useResendEmailVerificationWorkerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resendEmailVerificationMutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
    mutationKey: [resendEmailVerificationKey],
  });
}

export function useResendEmailVerificationWorkerMutationState() {
  const state = useMutationState({
    filters: { mutationKey: [resendEmailVerificationKey] },
    select: (mutation) => mutation.state,
  });

  return last(state) as
    | MutationState<unknown, ResponseError, ResendEmailVerificationDto>
    | undefined;
}
