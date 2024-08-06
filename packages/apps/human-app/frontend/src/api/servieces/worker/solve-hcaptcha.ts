import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import type { ResponseError } from '@/shared/types/global.type';

function solveHCaptcha({ token }: { token: string }) {
  return apiClient(apiPaths.worker.verifyHCaptchaLabeling, {
    successSchema: z.unknown(),
    authenticated: true,
    options: { method: 'POST', body: JSON.stringify({ token }) },
  });
}

export function useSolveHCaptchaMutation(callbacks?: {
  onSuccess?: (() => void) | (() => Promise<void>);
  onError?:
    | ((error: ResponseError) => void)
    | ((error: ResponseError) => Promise<void>);
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: solveHCaptcha,
    onSuccess: async () => {
      if (callbacks?.onSuccess) {
        await callbacks.onSuccess();
      }
      await queryClient.invalidateQueries();
    },
    onError: async (error) => {
      if (callbacks?.onError) {
        await callbacks.onError(error);
      }
      await queryClient.invalidateQueries();
    },
  });
}
