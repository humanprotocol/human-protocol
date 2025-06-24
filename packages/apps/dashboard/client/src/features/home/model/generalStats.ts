import { z } from 'zod';

export const generalStatsResponseSchema = z.object({
  totalHolders: z.number(),
  totalTransactions: z.number(),
});

export type GeneralStats = z.infer<typeof generalStatsResponseSchema>;
