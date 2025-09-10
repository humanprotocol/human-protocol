/* eslint-disable camelcase */
import { z } from 'zod';

export const enableHCaptchaLabelingResponseSchema = z.object({
  site_key: z.string(),
});

export const dailyHmtSpentResponseSchema = z.object({
  spend: z.number(),
});

export const hcaptchaUserStatsResponseSchema = z.object({
  balance: z.object({
    recent: z.number(),
    total: z.number(),
  }),
  served: z.number(),
  solved: z.number(),
  currentDateStats: z.object({
    solved: z.number(),
  }),
});
