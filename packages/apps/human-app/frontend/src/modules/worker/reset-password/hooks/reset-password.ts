/* eslint-disable camelcase */
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import { routerPaths } from '@/router/router-paths';
import { passwordService } from '../../services/password.service';

export const resetPasswordDtoSchema = z
  .object({
    password: z
      .string()
      .min(8, t('validation.min'))
      .max(50, t('validation.max', { count: 50 })),
    confirmPassword: z
      .string()
      .min(1, t('validation.required'))
      .max(50, t('validation.max', { count: 50 })),
    h_captcha_token: z
      .string()
      .min(1, t('validation.captcha'))
      .default('token'),
  })
  .refine(({ password, confirmPassword }) => confirmPassword === password, {
    message: t('validation.passwordMismatch'),
    path: ['confirmPassword'],
  });

export type ResetPasswordDto = z.infer<typeof resetPasswordDtoSchema>;

export const ResetPasswordSuccessResponseSchema = z.unknown();

export function useResetPasswordMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (
      data: Omit<ResetPasswordDto, 'confirmPassword'> & { token: string }
    ) => {
      try {
        return await passwordService.resetPassword({
          token: data.token,
          password: data.password,
        });
      } catch (error) {
        throw new Error('Failed to reset password');
      }
    },
    onSuccess: async () => {
      navigate(routerPaths.worker.resetPasswordSuccess);
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
