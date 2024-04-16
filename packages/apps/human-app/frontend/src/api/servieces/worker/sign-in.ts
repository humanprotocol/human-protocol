import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { routerPaths } from '@/shared/router-paths';

export const signInDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type SignUpDto = z.infer<typeof signInDtoSchema>;

const signUpSuccessResponseSchema = z.unknown();

function signInMutationFn(data: SignUpDto) {
  return apiClient(apiPaths.worker.signUp.path, {
    successSchema: signUpSuccessResponseSchema,
    options: { body: JSON.stringify(data) },
  });
}

export function useSignInMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: signInMutationFn,
    onSuccess: async () => {
      // TODO add correct path
      navigate(routerPaths.app.path);
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
