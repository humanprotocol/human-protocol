import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { signInSuccessResponseSchema } from '@/api/servieces/worker/sign-in';
import { useAuth } from '@/auth/use-auth';
import { browserAuthProvider } from '@/shared/helpers/browser-auth-provider';

export function useGetAccessTokenMutation() {
  const queryClient = useQueryClient();
  const { signIn } = useAuth();

  return useMutation({
    mutationFn: async () => {
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

        signIn(refetchAccessTokenSuccess);
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
