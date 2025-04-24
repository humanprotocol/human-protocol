import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';
import { useAccessTokenRefresh } from '@/api/hooks/use-access-token-refresh';
import * as hCaptchaLabelingService from '../services/hcaptcha-labeling.service';

export function useEnableHCaptchaLabelingMutation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { refreshAccessTokenAsync } = useAccessTokenRefresh();
  const mutation = useMutation({
    mutationFn: async () => {
      const result = await hCaptchaLabelingService.enableHCaptchaLabeling();

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

  return mutation;
}
