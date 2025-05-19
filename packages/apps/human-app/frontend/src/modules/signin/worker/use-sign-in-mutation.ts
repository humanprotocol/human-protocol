import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';
import { env } from '@/shared/env';
import { AuthService, HttpApiClient } from '@/api';
import { type SignInDto } from './schemas';

function signInMutationFn(data: SignInDto) {
  const httpClient = new HttpApiClient(env.VITE_API_URL);
  const auth = new AuthService(httpClient);

  return auth.signIn(data);
}

export function useSignInMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: signInMutationFn,
    onSuccess: async () => {
      navigate(routerPaths.worker.profile);
      window.location.reload();
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
