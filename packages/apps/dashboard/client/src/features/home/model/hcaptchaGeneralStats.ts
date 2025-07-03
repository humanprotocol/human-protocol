import { z } from 'zod';

export const hcaptchaGeneralStatsResponseSchema = z.object({
  solved: z.number(),
});

export type HcaptchaGeneralStats = z.infer<
  typeof hcaptchaGeneralStatsResponseSchema
>;
