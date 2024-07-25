/* eslint-disable camelcase -- ...*/
import { z } from 'zod';
import type { MutationState } from '@tanstack/react-query';
import {
  useMutation,
  useMutationState,
  useQueryClient,
} from '@tanstack/react-query';
import last from 'lodash/last';
import { t } from 'i18next';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import type { ResponseError } from '@/shared/types/global.type';
import { useAuth } from '@/auth/use-auth';

export const resendEmailVerificationHcaptchaSchema = z.object({
  h_captcha_token: z.string(),
});

export type ResendEmailVerificationHcaptchaDto = z.infer<
  typeof resendEmailVerificationHcaptchaSchema
>;
export const resendEmailVerificationEmailSchema = z.object({
  email: z.string().email(),
});

export type ResendEmailVerificationEmailDto = z.infer<
  typeof resendEmailVerificationEmailSchema
>;

export type ResendEmailVerificationDto = ResendEmailVerificationHcaptchaDto &
  ResendEmailVerificationEmailDto;

const ResendEmailVerificationSuccessResponseSchema = z.unknown();

async function resendEmailVerificationMutationFn(
  data: ResendEmailVerificationDto,
  isAuthenticated: boolean
) {
  if (!isAuthenticated) {
    throw new Error(t('worker.verifyEmail.authError'));
  }

  return apiClient(apiPaths.worker.resendEmailVerification.path, {
    authenticated: true,
    successSchema: ResendEmailVerificationSuccessResponseSchema,
    options: { method: 'POST', body: JSON.stringify(data) },
  });
}

const resendEmailVerificationKey = 'resendEmailVerification';

export function useResendEmailVerificationWorkerMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (dto: ResendEmailVerificationDto) =>
      resendEmailVerificationMutationFn(dto, Boolean(user)),
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
