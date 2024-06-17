/* eslint-disable camelcase -- ...*/
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { routerPaths } from '@/router/router-paths';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

const enableHCaptchaLabelingSuccessSchema = z.object({
  site_key: z.string(),
});

export type EnableHCaptchaLabelingSuccessResponse = z.infer<
  typeof enableHCaptchaLabelingSuccessSchema
>;

async function enableHCaptchaLabeling() {
  return apiClient(apiPaths.worker.enableHCaptchaLabeling, {
    successSchema: enableHCaptchaLabelingSuccessSchema,
    authenticated: true,
    options: { method: 'POST' },
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
