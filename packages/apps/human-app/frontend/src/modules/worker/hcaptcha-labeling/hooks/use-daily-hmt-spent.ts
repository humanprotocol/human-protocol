import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/api-client';
import { apiPaths } from '@/api/api-paths';

const dailyHmtSpentSchema = z.object({
  spend: z.number(),
});

type DailyHmtSpentResponse = z.infer<typeof dailyHmtSpentSchema>;

async function fetchDailyHmtSpent(): Promise<DailyHmtSpentResponse> {
  return apiClient(apiPaths.worker.dailyHmtSpend.path, {
    successSchema: dailyHmtSpentSchema,
    authenticated: true,
    options: { method: 'GET' },
  });
}

export function useDailyHmtSpent() {
  return useQuery<DailyHmtSpentResponse>({
    queryKey: ['dailyHmtSpent'],
    queryFn: fetchDailyHmtSpent,
  });
}
