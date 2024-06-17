import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { wait } from '@/shared/helpers/wait';

const dailyHmtSpentSchema = z.object({
  servedCaptchas: z.number(),
  solvedCaptchas: z.number(),
  currentDateSolvedCaptchas: z.number(),
  hmtTotal: z.number(),
  hmtRecent: z.number(),
  dailyHmtSpend: z.number(),
});

export type DailyHmtSpentSchemaSuccess = z.infer<typeof dailyHmtSpentSchema>;

export async function getDailyHmtSpent(): Promise<DailyHmtSpentSchemaSuccess> {
  // TODO connect with api
  // return apiClient(apiPaths.worker.hCaptchaUserStats, {
  //   successSchema: z.unknown(),
  //   options: { method: 'GET' },
  // });
  await wait(2000);

  return {
    servedCaptchas: 22,
    solvedCaptchas: 11,
    currentDateSolvedCaptchas: 2,
    hmtTotal: 11,
    hmtRecent: 2,
    dailyHmtSpend: 3,
  };
}

export function useDailyHmtSpent() {
  return useQuery({
    queryFn: getDailyHmtSpent,
    queryKey: ['getDailyHmtSpent'],
  });
}
