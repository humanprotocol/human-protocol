import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { apiPaths } from '@/api/api-paths';
import { apiClient } from '@/api/api-client';

const dailyHmtSpentSchema = z.object({
  spend: z.number(),
});

export type DailyHmtSpentSchemaSuccess = z.infer<typeof dailyHmtSpentSchema>;

export async function getDailyHmtSpent() {
  return apiClient(apiPaths.worker.dailyHmtSpend, {
    successSchema: dailyHmtSpentSchema,
    authenticated: true,
    options: { method: 'GET' },
  });
}

export function useDailyHmtSpent() {
  return useQuery({
    queryFn: getDailyHmtSpent,
    queryKey: ['getDailyHmtSpent'],
  });
}
