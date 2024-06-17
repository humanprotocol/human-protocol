import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { apiPaths } from '@/api/api-paths';
import { apiClient } from '@/api/api-client';

const hcaptchaUserStatsSchema = z.object({
  balance: z.object({
    available: z.number(),
    estimated: z.number(),
    recent: z.number(),
    total: z.number(),
  }),
  served: z.number(),
  solved: z.number(),
  verified: z.number(),
  // TODO verify response
  currentDateStats: z.object({
    served: z.number().optional(),
    solved: z.number().optional(),
    verified: z.number().optional(),
  }),
  // TODO verify response
  currentEarningsStats: z.object({
    hmtEarned: z.number().optional(),
  }),
});

export type HCaptchaUserStatsSuccess = z.infer<typeof hcaptchaUserStatsSchema>;

export async function getHCaptchaUsersStats() {
  return apiClient(apiPaths.worker.hCaptchaUserStats, {
    authenticated: true,
    successSchema: hcaptchaUserStatsSchema,
    options: { method: 'GET' },
  });
}

export function useHCaptchaUserStats() {
  return useQuery({
    queryFn: getHCaptchaUsersStats,
    queryKey: ['getHCaptchaUsersStats'],
  });
}
