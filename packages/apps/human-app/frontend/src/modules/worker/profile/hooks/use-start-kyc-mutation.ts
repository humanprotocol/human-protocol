import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import { profileService } from '../services/profile.service';

export function useKycStartMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuthenticatedUser();

  return useMutation({
    mutationFn: async () => profileService.startKyc(),
    onError: () => {
      void queryClient.invalidateQueries();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
    mutationKey: ['kycStart', user.email],
  });
}
