/* eslint-disable camelcase -- ... */
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { routerPaths } from '@/router/router-paths';

export const sendResetLinkEmailDtoSchema = z.object({
  email: z
    .string()
    .min(1, t('worker.sendResetLinkForm.noEmailError'))
    .email(t('worker.sendResetLinkForm.invalidEmailError')),
});

export type SendResetLinkEmail = z.infer<typeof sendResetLinkEmailDtoSchema>;

export const sendResetLinkHcaptchaDtoSchema = z.object({
  h_captcha_token: z.string(),
});

export type SendResetLinkHcaptcha = z.infer<
  typeof sendResetLinkHcaptchaDtoSchema
>;

export const sendResetLinkDtoSchema = sendResetLinkEmailDtoSchema.merge(
  sendResetLinkHcaptchaDtoSchema
);

export type SendResetLinkDto = SendResetLinkEmail & SendResetLinkHcaptcha;

const SendResetLinkSuccessResponseSchema = z.unknown();

function sendResetLinkMutationFn(data: SendResetLinkDto) {
  return apiClient(apiPaths.worker.sendResetLink.path, {
    successSchema: SendResetLinkSuccessResponseSchema,
    options: { method: 'POST', body: JSON.stringify(data) },
  });
}

export function useSendResetLinkMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: sendResetLinkMutationFn,
    onSuccess: async (_, { email }) => {
      navigate(routerPaths.worker.sendResetLinkSuccess, { state: { email } });
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
