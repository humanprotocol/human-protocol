import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/hooks/use-auth';
import { browserAuthProvider } from '@/shared/contexts/browser-auth-provider';
import { routerPaths } from '@/router/router-paths';
import { authService } from '../authorized-http-api-client';

type RefreshAccessTokenParams = {
  throwExpirationModalOnSignOut?: boolean;
};

export function useAccessTokenRefresh() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const mutation = useMutation({
    mutationFn: async (params?: RefreshAccessTokenParams) => {
      const throwExpirationModalOnSignOut =
        params?.throwExpirationModalOnSignOut ?? true;

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
    refreshAccessToken: (
      params?: RefreshAccessTokenParams,
      options?: Parameters<typeof mutation.mutate>[1]
    ) => {
      mutation.mutate(params, options);
    },
    refreshAccessTokenAsync: (
      params?: RefreshAccessTokenParams,
      options?: Parameters<typeof mutation.mutateAsync>[1]
    ) => mutation.mutateAsync(params, options),
    isRefreshingAccessToken: mutation.isPending,
  };
}
