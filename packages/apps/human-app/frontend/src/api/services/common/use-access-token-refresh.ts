import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/use-auth';
import { browserAuthProvider } from '@/shared/helpers/browser-auth-provider';
import type { AuthType } from '@/shared/types/browser-auth-provider';
import { useWeb3Auth } from '@/auth-web3/use-web3-auth';
import { routerPaths } from '@/router/router-paths';
import { refreshToken } from '@/api/fetcher';

export function useAccessTokenRefresh() {
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

  const mutation = useMutation({
    mutationFn: async ({
      authType,
      throwExpirationModalOnSignOut = true,
    }: {
      authType: AuthType;
      throwExpirationModalOnSignOut?: boolean;
    }) => {
      try {
        const refetchAccessTokenSuccess = await refreshToken();

        if (!refetchAccessTokenSuccess) {
          throw new Error('Failed to refresh access token.');
        }

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
            navigate(routerPaths.homePage);
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
    scope: {
      id: 'refresh-access-token',
    },
  });

  return {
    refreshAccessToken: mutation.mutate,
    refreshAccessTokenAsync: mutation.mutateAsync,
  };
}
