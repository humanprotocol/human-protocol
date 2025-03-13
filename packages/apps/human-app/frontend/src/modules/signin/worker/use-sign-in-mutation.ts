import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { routerPaths } from '@/router/router-paths';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { authTokensSuccessResponseSchema } from '@/shared/schemas';
import { type SignInDto } from './schemas';

function signInMutationFn(data: SignInDto) {
  return apiClient(apiPaths.worker.signIn.path, {
    successSchema: authTokensSuccessResponseSchema,
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
