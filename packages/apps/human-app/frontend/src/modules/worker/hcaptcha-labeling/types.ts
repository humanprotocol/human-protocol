import { type z } from 'zod';
import {
  type enableHCaptchaLabelingResponseSchema,
  type dailyHmtSpentResponseSchema,
  type hcaptchaUserStatsResponseSchema,
} from './schemas';

export type EnableHCaptchaLabelingSuccessResponse = z.infer<
  typeof enableHCaptchaLabelingResponseSchema
>;

export type DailyHmtSpentResponse = z.infer<typeof dailyHmtSpentResponseSchema>;

export type HCaptchaUserStatsSuccess = z.infer<
  typeof hcaptchaUserStatsResponseSchema
>;

export interface VerifyHCaptchaLabelingBody {
  token: string;
}
