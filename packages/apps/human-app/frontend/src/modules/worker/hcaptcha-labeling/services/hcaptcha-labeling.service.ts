import { AuthorizedHttpApiClient, HttpApiClient, ApiClientError } from '@/api';
import { env } from '@/shared/env';
import { AuthService } from '@/api/auth-service';
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
  private readonly authorizedHttpApiClient: AuthorizedHttpApiClient;

  constructor() {
    const httpClient = new HttpApiClient(env.VITE_API_URL);
    const authService = new AuthService(httpClient);
    this.authorizedHttpApiClient = new AuthorizedHttpApiClient(
      env.VITE_API_URL,
      authService
    );
  }

  async enableHCaptchaLabeling() {
    try {
      const result =
        await this.authorizedHttpApiClient.post<EnableHCaptchaLabelingSuccessResponse>(
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
      const result = await this.authorizedHttpApiClient.post<
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
        await this.authorizedHttpApiClient.get<HCaptchaUserStatsSuccess>(
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
        await this.authorizedHttpApiClient.get<DailyHmtSpentResponse>(
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
