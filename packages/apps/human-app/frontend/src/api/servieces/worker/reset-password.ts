import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { passwordRegex } from '@/shared/helpers/regex';
import { routerPaths } from '@/router/router-paths';

export const resetPasswordDtoSchema = z.object({
  password: z
    .object({
      password: z
        .string()
        .max(50, t('validation.max', { count: 50 }))
        .regex(passwordRegex, t('validation.passwordWeak')),
      confirmPassword: z
        .string()
        .min(1, t('validation.required'))
        .max(50, t('validation.max', { count: 50 })),
    })
    .refine(({ password, confirmPassword }) => confirmPassword === password, {
      message: t('validation.passwordMismatch'),
      path: ['confirmPassword'],
    }),
});

export type ResetPasswordDto = z.infer<typeof resetPasswordDtoSchema>;

const SendResetLinkSuccessResponseSchema = z.unknown();

function resetPasswordMutationFn(data: ResetPasswordDto) {
  return apiClient(apiPaths.worker.signUp.path, {
    successSchema: SendResetLinkSuccessResponseSchema,
    options: { body: JSON.stringify(data) },
  });
}

export function useResetPasswordMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: resetPasswordMutationFn,
    onSuccess: async () => {
      // TODO add correct path
      navigate(routerPaths.homePage);
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
