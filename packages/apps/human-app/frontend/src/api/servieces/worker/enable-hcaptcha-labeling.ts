/* eslint-disable camelcase -- ...*/
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { routerPaths } from '@/router/router-paths';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';
import { useGetAccessTokenMutation } from '@/api/servieces/common/get-access-token';

const enableHCaptchaLabelingSuccessSchema = z.object({
  site_key: z.string(),
});

export type EnableHCaptchaLabelingSuccessResponse = z.infer<
  typeof enableHCaptchaLabelingSuccessSchema
>;

export function useEnableHCaptchaLabelingMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { mutateAsync: getAccessTokenMutation } = useGetAccessTokenMutation();

  return useMutation({
    mutationFn: async () => {
      const result = await apiClient(apiPaths.worker.enableHCaptchaLabeling, {
        successSchema: enableHCaptchaLabelingSuccessSchema,
        authenticated: true,
        options: { method: 'POST' },
      });
      await getAccessTokenMutation();
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
