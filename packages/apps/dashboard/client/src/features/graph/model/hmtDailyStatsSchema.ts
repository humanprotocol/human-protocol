import { z } from 'zod';

export const hmtDailyStatsSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  results: z.array(
    z.object({
      totalTransactionAmount: z.string().transform((value, ctx) => {
        const valueAsNumber = Number(value);
        if (Number.isNaN(valueAsNumber)) {
          ctx.addIssue({
            path: ['totalTransactionAmount'],
            code: z.ZodIssueCode.custom,
          });
        }

        return valueAsNumber / 10 ** 18;
      }),
      totalTransactionCount: z.number(),
      dailyUniqueSenders: z.number(),
      dailyUniqueReceivers: z.number(),
      date: z.string(),
    })
  ),
});

export type HMTDailyStatsResponse = z.output<typeof hmtDailyStatsSchema>;

export type HMTDailyStats = HMTDailyStatsResponse['results'][number];
