import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { wait } from '@/shared/helpers/wait';

const hcaptchaUserStatsSchema = z.object({
  jobsServed: z.number(),
  jobsComplete: z.number(),
  hmtEarned: z.number(),
  hmtEarnedSinceLogged: z.number(),
});

export type HCaptchaUserStatsSuccess = z.infer<typeof hcaptchaUserStatsSchema>;

export async function getHCaptchaUsersStats(): Promise<HCaptchaUserStatsSuccess> {
  // TODO connect with api
  // return apiClient(apiPaths.worker.hCaptchaUserStats, {
  //   successSchema: z.unknown(),
  //   options: { method: 'GET' },
  // });
  await wait(10000);

  return {
    jobsServed: 14724,
    jobsComplete: 13845,
    hmtEarned: 14.690886,
    hmtEarnedSinceLogged: 2.64302,
  };
}

export function useHCaptchaUserStats() {
  return useQuery({
    queryFn: getHCaptchaUsersStats,
    queryKey: ['getHCaptchaUsersStats'],
  });
}
