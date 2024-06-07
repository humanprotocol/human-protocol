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
import { useAuthenticatedUser } from '@/auth/use-authenticated-user';
import type { ResponseError } from '@/shared/types/global.type';

export const resendEmailVerificationDtoSchema = z.object({
  email: z.string().email(),
});

export type ResendEmailVerificationDto = z.infer<
  typeof resendEmailVerificationDtoSchema
>;

const ResendEmailVerificationSuccessResponseSchema = z.unknown();

function resendEmailVerificationMutationFn(data: ResendEmailVerificationDto) {
  return apiClient(apiPaths.worker.resendEmailVerification.path, {
    authenticated: true,
    successSchema: ResendEmailVerificationSuccessResponseSchema,
    options: { method: 'POST', body: JSON.stringify(data) },
  });
}

const resendEmailVerificationKey = 'resendEmailVerification';

export function useResendEmailVerificationWorkerMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuthenticatedUser();

  return useMutation({
    mutationFn: resendEmailVerificationMutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
    mutationKey: [resendEmailVerificationKey, user.email],
  });
}

export function useResendEmailVerificationWorkerMutationState() {
  const { user } = useAuthenticatedUser();

  const state = useMutationState({
    filters: { mutationKey: [resendEmailVerificationKey, user.email] },
    select: (mutation) => mutation.state,
  });

  return last(state) as
    | MutationState<unknown, ResponseError, ResendEmailVerificationDto>
    | undefined;
}
