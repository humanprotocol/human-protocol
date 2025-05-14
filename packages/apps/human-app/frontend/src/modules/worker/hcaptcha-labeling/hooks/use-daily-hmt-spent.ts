import { useQuery } from '@tanstack/react-query';
import * as hCaptchaLabelingService from '../services/hcaptcha-labeling.service';
import { type DailyHmtSpentResponse } from '../types';

export function useDailyHmtSpent() {
  return useQuery<DailyHmtSpentResponse>({
    queryKey: ['dailyHmtSpent'],
    queryFn: async () => hCaptchaLabelingService.getDailyHmtSpent(),
  });
}
