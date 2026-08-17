import { useMutation } from '@tanstack/react-query';
import * as profileService from '../services/profile.service';
import { useAuth } from '@/modules/auth/hooks/use-auth';

export function useIdvStartMutation() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => profileService.startIdv(),
    mutationKey: ['idvStart', user?.email],
  });
}
