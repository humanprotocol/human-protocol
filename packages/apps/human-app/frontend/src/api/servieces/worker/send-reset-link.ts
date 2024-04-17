import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { routerPaths } from '@/router/router-paths';

export const sendResetLinkDtoSchema = z.object({
  email: z.string().email(),
});

export type SendResetLinkDto = z.infer<typeof sendResetLinkDtoSchema>;

const SendResetLinkSuccessResponseSchema = z.unknown();

function sendResetLinkMutationFn(data: SendResetLinkDto) {
  return apiClient(apiPaths.worker.signUp.path, {
    successSchema: SendResetLinkSuccessResponseSchema,
    options: { body: JSON.stringify(data) },
  });
}

export function useSendResetLinkMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: sendResetLinkMutationFn,
    onSuccess: async () => {
      // TODO add correct path
      navigate(routerPaths.worker.sendResetLink);
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
