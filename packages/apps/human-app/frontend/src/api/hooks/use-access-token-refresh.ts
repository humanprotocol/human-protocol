import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { browserAuthProvider } from '@/shared/contexts/browser-auth-provider';
import type { AuthType } from '@/shared/types/browser-auth-provider';
import { useWeb3Auth } from '@/modules/auth-web3/hooks/use-web3-auth';
import { routerPaths } from '@/router/router-paths';
import { authService } from '../authorized-http-api-client';

export function useAccessTokenRefresh() {
  const navigate = useNavigate();
  const { signOut: web2SignOut, user: web2User } = useAuth();

  const { signOut: web3SignOut, user: web3User } = useWeb3Auth();

  const mutation = useMutation({
    mutationFn: async ({
      authType,
      throwExpirationModalOnSignOut = true,
    }: {
      authType: AuthType;
      throwExpirationModalOnSignOut?: boolean;
    }) => {
      try {
        await authService.refreshAccessToken();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        if (authType === 'web2' && web2User) {
          web2SignOut({ throwExpirationModal: false });
        }
        if (authType === 'web3' && web3User) {
          web3SignOut({ throwExpirationModal: false });
        }
        browserAuthProvider.signOut({
          triggerSignOutSubscriptions: throwExpirationModalOnSignOut,
          callback: () => {
            navigate(routerPaths.homePage);
          },
        });
      }
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
