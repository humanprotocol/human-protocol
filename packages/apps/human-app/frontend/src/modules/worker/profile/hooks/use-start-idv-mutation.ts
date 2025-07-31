import { useMutation } from '@tanstack/react-query';
import { useAuthenticatedUser } from '@/modules/auth/hooks/use-authenticated-user';
import * as profileService from '../services/profile.service';

export function useIdvStartMutation() {
  const { user } = useAuthenticatedUser();

  return useMutation({
    mutationFn: async () => profileService.startIdv(),
    mutationKey: ['idvStart', user.email],
  });
}
