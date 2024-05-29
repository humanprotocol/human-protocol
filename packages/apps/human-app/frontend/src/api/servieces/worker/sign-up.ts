import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { routerPaths } from '@/router/router-paths';
import { passwordRegex } from '@/shared/helpers/regex';
import { signInSuccessResponseSchema } from '@/api/servieces/worker/sign-in';
import { useAuth } from '@/auth/use-auth';

export const signUpDtoSchema = z
  .object({
    email: z.string().email(t('validation.invalidEmail')),
    // eslint-disable-next-line camelcase -- export vite config
    h_captcha_token: z.string().default('token'),
  })
  .and(
    z
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
      })
  );

export type SignUpDto = z.infer<typeof signUpDtoSchema>;

const signUpSuccessResponseSchema = z.unknown();

async function signUpMutationFn(data: Omit<SignUpDto, 'confirmPassword'>) {
  await apiClient(apiPaths.worker.signUp.path, {
    successSchema: signUpSuccessResponseSchema,
    options: { method: 'POST', body: JSON.stringify(data) },
  });

  return apiClient(apiPaths.worker.signIn.path, {
    successSchema: signInSuccessResponseSchema,
    options: {
      method: 'POST',
      body: JSON.stringify(data),
    },
  });
}

export function useSignUpMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  return useMutation({
    mutationFn: signUpMutationFn,
    onSuccess: async (successSignInData, { email }) => {
      signIn(successSignInData);
      navigate(routerPaths.worker.sendEmailVerification, {
        state: { routerState: { email } },
      });
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
