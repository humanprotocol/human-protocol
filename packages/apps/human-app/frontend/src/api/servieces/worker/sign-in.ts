import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { t } from 'i18next';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { routerPaths } from '@/router/router-paths';

export const signInDtoSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(1, t('validation.required'))
    .max(50, t('validation.max', { count: 50 })),
  // eslint-disable-next-line camelcase -- export vite config
  h_captcha_token: z.string().default('token'),
});

export type SignInDto = z.infer<typeof signInDtoSchema>;

const signInSuccessResponseSchema = z.unknown();

function signInMutationFn(data: SignInDto) {
  return apiClient(apiPaths.worker.signIn.path, {
    successSchema: signInSuccessResponseSchema,
    options: { method: 'POST', body: JSON.stringify(data) },
  });
}

export function useSignInMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: signInMutationFn,
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
