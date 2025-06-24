import { z } from 'zod';

export const hcaptchaDailyStatsSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  results: z.array(
    z.object({
      solved: z.number(),
      date: z.string(),
    })
  ),
});

export type HcaptchaDailyStatsResponse = z.infer<
  typeof hcaptchaDailyStatsSchema
>;

export type HcaptchaDailyStats = HcaptchaDailyStatsResponse['results'][number];
