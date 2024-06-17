import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';
import { wait } from '@/shared/helpers/wait';
import { env } from '@/shared/env';
// TODO add endpoint
// const enableHCaptchaLabelingSuccessSchema = z.unknown();

async function enableHCaptchaLabeling() {
  // TODO add endpoint
  // return apiClient(apiPaths.worker.enableHCaptchaLabeling, {
  //   successSchema: ResetPasswordSuccessResponseSchema,
  //   options: { method: 'POST', body: JSON.stringify(data) },
  // });
  await wait(1000);
  return Promise.resolve({
    // eslint-disable-next-line camelcase --- ...
    site_key: env.VITE_H_CAPTCHA_SITE_KEY,
  });
}

export function useEnableHCaptchaLabelingMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: enableHCaptchaLabeling,
    onSuccess: async () => {
      navigate(routerPaths.worker.HcaptchaLabeling);
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
