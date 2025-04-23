import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';
import { passwordService } from '../password.service';
import { type ResetPasswordDto } from '../types';

export const ResetPasswordSuccessResponseSchema = z.unknown();

export function useResetPasswordMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (
      data: Omit<ResetPasswordDto, 'confirmPassword'> & { token: string }
    ) => passwordService.resetPassword(data),
    onSuccess: async () => {
      navigate(routerPaths.worker.resetPasswordSuccess);
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
