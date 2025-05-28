import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import * as profileService from '../services/profile.service';

export function useIdvStartMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuthenticatedUser();

  return useMutation({
    mutationFn: async () => profileService.startIdv(),
    onError: () => {
      void queryClient.invalidateQueries();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries();
    },
    mutationKey: ['idvStart', user.email],
  });
}
