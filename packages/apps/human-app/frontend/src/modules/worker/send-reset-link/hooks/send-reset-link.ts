import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';
import { type SendResetLinkDto } from '../schemas';
import * as passwordService from '../../reset-password/password.service';

export const SendResetLinkSuccessResponseSchema = z.unknown();

export function useSendResetLinkMutation() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: SendResetLinkDto) =>
      passwordService.sendResetLink(data),
    onSuccess: (_, { email }) => {
      navigate(routerPaths.worker.sendResetLinkSuccess, { state: { email } });
    },
  });
}
