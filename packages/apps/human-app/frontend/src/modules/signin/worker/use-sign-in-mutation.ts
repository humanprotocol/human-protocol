import { useMutation } from '@tanstack/react-query';
import { env } from '@/shared/env';
import { AuthService, HttpApiClient } from '@/api';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { type SignInDto } from './schemas';

function signInMutationFn(data: SignInDto) {
  const httpClient = new HttpApiClient(env.VITE_API_URL);
  const auth = new AuthService(httpClient);

  return auth.signIn(data);
}

export function useSignInMutation() {
  const { signIn } = useAuth();

  return useMutation({
    mutationFn: signInMutationFn,
    onSuccess: (successResponse) => {
      signIn(successResponse);
    },
  });
}
