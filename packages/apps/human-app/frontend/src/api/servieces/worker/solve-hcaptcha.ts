import { ResponseError } from '@/shared/types/global.type';
import { useMutation, useQueryClient } from '@tanstack/react-query';

function solveHCaptcha({ token }: { token: string }) {
  console.log({ token });
  // return apiClient(apiPaths.worker.resetPassword.path, {
  //   successSchema: ResetPasswordSuccessResponseSchema,
  //   options: { method: 'POST', body: JSON.stringify(data) },
  // });
  return Promise.resolve(token);
}

export function useSolveHCaptchaMutation(callbacks?: {
  onSuccess?: () => void;
  onError?: (error: ResponseError) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: solveHCaptcha,
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      if (callbacks?.onSuccess) {
        callbacks.onSuccess();
      }
    },
    onError: async (error) => {
      await queryClient.invalidateQueries();
      if (callbacks?.onError) {
        callbacks.onError(error);
      }
    },
  });
}
