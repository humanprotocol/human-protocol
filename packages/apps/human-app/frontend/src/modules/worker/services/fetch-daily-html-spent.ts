import { z } from 'zod';
import { apiPaths } from '@/api/api-paths';
import { apiClient } from '@/api/api-client';

const dailyHmtSpentSchema = z.object({
  spend: z.number(),
});

export type DailyHmtSpentResponse = z.infer<typeof dailyHmtSpentSchema>;

export async function fetchDailyHmtSpent(): Promise<DailyHmtSpentResponse> {
  return apiClient(apiPaths.worker.dailyHmtSpend.path, {
    successSchema: dailyHmtSpentSchema,
    authenticated: true,
    options: { method: 'GET' },
  });
}
