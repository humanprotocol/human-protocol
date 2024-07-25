import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { signInSuccessResponseSchema } from '@/api/servieces/worker/sign-in';
import { useAuth } from '@/auth/use-auth';
import { browserAuthProvider } from '@/shared/helpers/browser-auth-provider';
import type { AuthType } from '@/shared/types/browser-auth-provider';
import { useWeb3Auth } from '@/auth-web3/use-web3-auth';

export function useGetAccessTokenMutation() {
  const queryClient = useQueryClient();
  const { signIn: signInWeb2 } = useAuth();
  const { signIn: signInWeb3 } = useWeb3Auth();

  return useMutation({
    mutationFn: async (authType: AuthType) => {
      try {
        const refetchAccessTokenSuccess = await apiClient(
          apiPaths.worker.obtainAccessToken.path,
          {
            successSchema: signInSuccessResponseSchema,
            options: {
              method: 'POST',
              body: JSON.stringify({
                // eslint-disable-next-line camelcase -- camel case defined by api
                refresh_token: browserAuthProvider.getRefreshToken(),
              }),
            },
          }
        );

        if (authType === 'web2') {
          signInWeb2(refetchAccessTokenSuccess);
        } else {
          signInWeb3(refetchAccessTokenSuccess);
        }
      } catch (error) {
        browserAuthProvider.signOut(() => {
          window.location.reload();
        });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
