import { useMutation } from '@tanstack/react-query';

import * as verifyUserService from '../services/verify-user.service';
import { useAuth } from '@/modules/auth/hooks/use-auth';

export function useIdvStartMutation() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => verifyUserService.startIdv(),
    mutationKey: ['idvStart', user?.email],
  });
}
