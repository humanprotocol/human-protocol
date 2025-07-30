import { useMutation } from '@tanstack/react-query';
import type { ResponseError } from '@/shared/types/global.type';
import * as hCaptchaLabelingService from '../services/hcaptcha-labeling.service';
import { type VerifyHCaptchaLabelingBody } from '../types';

export function useSolveHCaptchaMutation(callbacks?: {
  onSuccess?: (() => void) | (() => Promise<void>);
  onError?:
    | ((error: ResponseError) => void)
    | ((error: ResponseError) => Promise<void>);
}) {
  return useMutation({
    mutationFn: async (data: VerifyHCaptchaLabelingBody) =>
      hCaptchaLabelingService.verifyHCaptchaLabeling(data),
    onSuccess: async () => {
      if (callbacks?.onSuccess) {
        await callbacks.onSuccess();
      }
    },
    onError: async (error) => {
      if (callbacks?.onError) {
        await callbacks.onError(error);
      }
    },
  });
}
