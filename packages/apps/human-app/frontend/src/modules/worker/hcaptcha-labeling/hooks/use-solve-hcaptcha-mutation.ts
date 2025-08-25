import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ResponseError } from '@/shared/types/global.type';
import * as hCaptchaLabelingService from '../services/hcaptcha-labeling.service';
import { type VerifyHCaptchaLabelingBody } from '../types';

export function useSolveHCaptchaMutation(callbacks: {
  onSuccess: () => void | Promise<void>;
  onError: (error: ResponseError) => void | Promise<void>;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: VerifyHCaptchaLabelingBody) =>
      hCaptchaLabelingService.verifyHCaptchaLabeling(data),
    onSuccess: () => {
      void callbacks.onSuccess();
      void queryClient.invalidateQueries({
        queryKey: ['getHCaptchaUsersStats'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['dailyHmtSpent'],
      });
    },
    onError: (error) => {
      void callbacks.onError(error);
    },
  });
}
