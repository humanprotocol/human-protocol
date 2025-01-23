import { useQuery } from '@tanstack/react-query';
import { fetchDailyHmtSpent } from '@/modules/worker/services/fetch-daily-html-spent';
import type { DailyHmtSpentResponse } from '@/modules/worker/services/fetch-daily-html-spent';

export function useDailyHmtSpent() {
  return useQuery<DailyHmtSpentResponse>({
    queryKey: ['dailyHmtSpent'],
    queryFn: fetchDailyHmtSpent,
  });
}
