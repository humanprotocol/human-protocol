import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { signInSuccessResponseSchema } from '@/api/services/worker/sign-in';
import { useAuth } from '@/auth/use-auth';
import { browserAuthProvider } from '@/shared/helpers/browser-auth-provider';
import type { AuthType } from '@/shared/types/browser-auth-provider';
import { useWeb3Auth } from '@/auth-web3/use-web3-auth';
import { routerPaths } from '@/router/router-paths';

export function useGetAccessTokenMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const {
    signIn: signInWeb2,
    signOut: web2SignOut,
    user: web2User,
  } = useAuth();
  const {
    signIn: signInWeb3,
    signOut: web3SignOut,
    user: web3User,
  } = useWeb3Auth();

  return useMutation({
    mutationFn: async ({
      authType,
      throwExpirationModalOnSignOut = true,
    }: {
      authType: AuthType;
      throwExpirationModalOnSignOut?: boolean;
    }) => {
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
        if (authType === 'web2' && web2User) {
          web2SignOut(false);
        }
        if (authType === 'web3' && web3User) {
          web3SignOut(false);
        }
        browserAuthProvider.signOut({
          triggerSignOutSubscriptions: throwExpirationModalOnSignOut,
          callback: () => {
            if (authType === 'web2') {
              navigate(routerPaths.worker.signIn);
            } else {
              navigate(routerPaths.homePage);
            }
          },
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
