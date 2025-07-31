import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { routerPaths } from '@/router/router-paths';
import { useAccessTokenRefresh } from '@/api/hooks/use-access-token-refresh';
import * as hCaptchaLabelingService from '../services/hcaptcha-labeling.service';

export function useEnableHCaptchaLabelingMutation() {
  const navigate = useNavigate();
  const { refreshAccessTokenAsync } = useAccessTokenRefresh();
  const mutation = useMutation({
    mutationFn: async () => {
      const result = await hCaptchaLabelingService.enableHCaptchaLabeling();

      await refreshAccessTokenAsync({ authType: 'web2' });

      return result;
    },
    onSuccess: () => {
      navigate(routerPaths.worker.HcaptchaLabeling);
    },
  });

  return mutation;
}
