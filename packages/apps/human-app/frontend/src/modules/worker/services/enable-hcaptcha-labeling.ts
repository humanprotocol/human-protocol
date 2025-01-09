/* eslint-disable camelcase -- ...*/
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { routerPaths } from '@/router/router-paths';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { useAccessTokenRefresh } from '@/api/hooks/use-access-token-refresh';

const enableHCaptchaLabelingSuccessSchema = z.object({
  site_key: z.string(),
});

export type EnableHCaptchaLabelingSuccessResponse = z.infer<
  typeof enableHCaptchaLabelingSuccessSchema
>;

export function useEnableHCaptchaLabelingMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { refreshAccessTokenAsync } = useAccessTokenRefresh();

  return useMutation({
    mutationFn: async () => {
      const result = await apiClient(
        apiPaths.worker.enableHCaptchaLabeling.path,
        {
          successSchema: enableHCaptchaLabelingSuccessSchema,
          authenticated: true,
          options: { method: 'POST' },
        }
      );
      await refreshAccessTokenAsync({ authType: 'web2' });
      return result;
    },
    onSuccess: async () => {
      navigate(routerPaths.worker.HcaptchaLabeling);
      await queryClient.invalidateQueries();
    },
    onError: async () => {
      await queryClient.invalidateQueries();
    },
  });
}
