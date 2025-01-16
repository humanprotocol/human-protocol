import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { routerPaths } from '@/router/router-paths';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { type SignInDto } from './types';
import { signInSuccessResponseSchema } from './schema';

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
