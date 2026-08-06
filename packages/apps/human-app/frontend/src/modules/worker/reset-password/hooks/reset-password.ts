import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { routerPaths } from '@/router/router-paths';
import * as passwordService from '../password.service';
import { type ResetPasswordDto } from '../types';

export function useResetPasswordMutation() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (
      data: Omit<ResetPasswordDto, 'confirmPassword'> & { token: string }
    ) => passwordService.resetPassword(data),
    onSuccess: () => {
      navigate(routerPaths.resetPasswordSuccess);
    },
  });
}
