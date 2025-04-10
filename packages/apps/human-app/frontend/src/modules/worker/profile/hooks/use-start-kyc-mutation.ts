import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { useAccessTokenRefresh } from '@/api/hooks/use-access-token-refresh';
import { profileService } from '../services/profile.service';

export function useKycStartMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuthenticatedUser();
  const { refreshAccessTokenAsync } = useAccessTokenRefresh();

  return useMutation({
    mutationFn: async () => {
      try {
        return await profileService.startKyc({ provider: 'veriff' });
      } catch (error) {
        await refreshAccessTokenAsync({ authType: 'web2' });
        throw error;
      }
    },

    onError: () => {
      void queryClient.invalidateQueries();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
    mutationKey: ['kycStart', user.email],
  });
}
