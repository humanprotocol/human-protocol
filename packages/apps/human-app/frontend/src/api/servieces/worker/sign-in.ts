import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
// eslint-disable-next-line import/no-cycle -- cause by refresh token retry
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { routerPaths } from '@/router/router-paths';
import { useAuth } from '@/auth/use-auth';

export const signInDtoSchema = z.object({
  email: z.string().email(t('validation.invalidEmail')),
  password: z
    .string()
    .min(1, t('validation.passwordMissing'))
    .max(50, t('validation.max', { count: 50 })),
  // eslint-disable-next-line camelcase -- export vite config
  h_captcha_token: z.string().min(1, t('validation.captcha')).default('token'),
});

export type SignInDto = z.infer<typeof signInDtoSchema>;

export const signInSuccessResponseSchema = z.object({
  // eslint-disable-next-line camelcase -- data from api
  access_token: z.string(),
  // eslint-disable-next-line camelcase -- data from api
  refresh_token: z.string(),
});

export type SignInSuccessResponse = z.infer<typeof signInSuccessResponseSchema>;

function signInMutationFn(data: SignInDto) {
  return apiClient(apiPaths.worker.signIn.path, {
    successSchema: signInSuccessResponseSchema,
    options: {
      method: 'POST',
      body: JSON.stringify(data),
    },
  });
}

export function useSignInMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  return useMutation({
    mutationFn: signInMutationFn,
    onSuccess: async (data) => {
      signIn(data);
      navigate(routerPaths.worker.profile);
      window.location.reload();
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
