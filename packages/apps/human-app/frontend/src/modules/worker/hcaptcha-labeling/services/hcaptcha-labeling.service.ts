import { ApiClientError, authorizedHumanAppApiClient } from '@/api';
import {
  enableHCaptchaLabelingResponseSchema,
  hcaptchaUserStatsResponseSchema,
  dailyHmtSpentResponseSchema,
} from '../schemas';
import {
  type EnableHCaptchaLabelingSuccessResponse,
  type HCaptchaUserStatsSuccess,
  type DailyHmtSpentResponse,
  type VerifyHCaptchaLabelingBody,
} from '../types';

const apiPaths = {
  enableHCaptchaLabeling: '/labeling/h-captcha/enable',
  verifyHCaptchaLabeling: '/labeling/h-captcha/verify',
  hCaptchaUserStats: '/labeling/h-captcha/user-stats',
  dailyHmtSpend: '/labeling/h-captcha/daily-hmt-spent',
};

export class HCaptchaLabelingService {
  async enableHCaptchaLabeling() {
    try {
      const result =
        await authorizedHumanAppApiClient.post<EnableHCaptchaLabelingSuccessResponse>(
          apiPaths.enableHCaptchaLabeling,
          {
            successSchema: enableHCaptchaLabelingResponseSchema,
          }
        );
      return result;
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('Failed to enable hCaptcha labeling');
    }
  }

  async verifyHCaptchaLabeling(data: VerifyHCaptchaLabelingBody) {
    try {
      const result = await authorizedHumanAppApiClient.post<
        Record<string, unknown>
      >(apiPaths.verifyHCaptchaLabeling, {
        body: { ...data },
      });
      return result;
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('Failed to verify hCaptcha labeling');
    }
  }

  async getHCaptchaUserStats() {
    try {
      const result =
        await authorizedHumanAppApiClient.get<HCaptchaUserStatsSuccess>(
          apiPaths.hCaptchaUserStats,
          {
            successSchema: hcaptchaUserStatsResponseSchema,
          }
        );
      return result;
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('Failed to get hCaptcha user stats');
    }
  }

  async getDailyHmtSpent() {
    try {
      const result =
        await authorizedHumanAppApiClient.get<DailyHmtSpentResponse>(
          apiPaths.dailyHmtSpend,
          {
            successSchema: dailyHmtSpentResponseSchema,
          }
        );

      return result;
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new Error('Failed to get daily HMT spent');
    }
  }
}

export const hCaptchaLabelingService = new HCaptchaLabelingService();
