import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';
import { type SendResetLinkDto } from '../schemas';
import { passwordService } from '../../reset-password/password.service';

export const SendResetLinkSuccessResponseSchema = z.unknown();

export function useSendResetLinkMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: SendResetLinkDto) => {
      return passwordService.sendResetLink(data);
    },
    onSuccess: async (_, { email }) => {
      navigate(routerPaths.worker.sendResetLinkSuccess, { state: { email } });
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
