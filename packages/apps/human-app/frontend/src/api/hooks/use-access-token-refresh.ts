import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { browserAuthProvider } from '@/shared/contexts/browser-auth-provider';
import type { AuthType } from '@/shared/types/browser-auth-provider';
import { routerPaths } from '@/router/router-paths';
import { authService } from '../authorized-http-api-client';

export function useAccessTokenRefresh() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const mutation = useMutation({
    mutationFn: async ({
      throwExpirationModalOnSignOut = true,
    }: {
      authType: AuthType;
      throwExpirationModalOnSignOut?: boolean;
    }) => {
      try {
        await authService.refreshAccessToken();
      } catch (error) {
        console.error(error);
        if (user) {
          signOut({ throwExpirationModal: false });
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
    isRefreshingAccessToken: mutation.isPending,
  };
}
