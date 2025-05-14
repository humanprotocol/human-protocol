import { useQuery } from '@tanstack/react-query';
import * as hCaptchaLabelingService from '../services/hcaptcha-labeling.service';

export function useHCaptchaUserStats() {
  return useQuery({
    queryFn: async () => hCaptchaLabelingService.getHCaptchaUserStats(),
    queryKey: ['getHCaptchaUsersStats'],
  });
}
