import { z } from 'zod';

import { reputationSchema } from '@/shared/model/reputationSchema';

const leaderboardEntity = z.object({
  address: z.string(),
  role: z.string(),
  amountStaked: z
    .string()
    .transform((value, ctx) => {
      const valueAsNumber = Number(value);

      if (Number.isNaN(valueAsNumber)) {
        ctx.addIssue({
          path: ['amountStaked'],
          code: z.ZodIssueCode.custom,
        });
      }

      return valueAsNumber / 10 ** 18;
    })
    .nullable(),
  reputation: reputationSchema,
  fee: z.number().nullable(),
  jobTypes: z.array(z.string()).nullable(),
  url: z.string().nullable(),
  website: z.string().nullable(),
  chainId: z.number(),
  name: z.string().nullable(),
  category: z.string().nullable(),
});

export const leaderboardResponseSchema = z.array(leaderboardEntity);
export type LeaderboardEntity = z.infer<typeof leaderboardEntity>;
export type LeaderboardData = z.infer<typeof leaderboardResponseSchema>;
