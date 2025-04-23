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
    available: z.number(),
    estimated: z.number(),
    recent: z.number(),
    total: z.number(),
  }),
  served: z.number(),
  solved: z.number(),
  verified: z.number(),
  currentDateStats: z.object({
    billing_units: z.number(),
    bypass: z.number(),
    served: z.number(),
    solved: z.number(),
  }),
  currentEarningsStats: z.number(),
});
