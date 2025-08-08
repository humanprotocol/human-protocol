import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { DAILY_HMT_SPENT_CACHE_KEY } from '../../common/constants/cache';
import { HCaptchaStatisticsGateway } from '../../integrations/h-captcha-labeling/h-captcha-statistics.gateway';
import { HCaptchaVerifyGateway } from '../../integrations/h-captcha-labeling/h-captcha-verify.gateway';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';
import logger from '../../logger';
import {
  DailyHmtSpentCommand,
  DailyHmtSpentResponse,
} from './model/daily-hmt-spent.model';
import {
  EnableLabelingCommand,
  EnableLabelingResponse,
} from './model/enable-labeling.model';
import { UserStatsCommand, UserStatsResponse } from './model/user-stats.model';
import {
  VerifyTokenCommand,
  VerifyTokenResponse,
} from './model/verify-token.model';

@Injectable()
export class HCaptchaService {
  private readonly logger = logger.child({ context: HCaptchaService.name });

  constructor(
    private readonly configService: EnvironmentConfigService,
    private readonly hCaptchaLabelingGateway: HCaptchaStatisticsGateway,
    private readonly hCaptchaVerifyGateway: HCaptchaVerifyGateway,
    private readonly reputationOracleGateway: ReputationOracleGateway,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async verifyToken(command: VerifyTokenCommand): Promise<VerifyTokenResponse> {
    this.checkIfHcaptchaSitekeyPresent(command.sitekey);

    const result = await this.hCaptchaVerifyGateway.sendTokenToVerify(command);
    if (result?.success) {
      return new VerifyTokenResponse('CAPTCHA was verified successfully');
    }

    const message = 'Failed to verify hCaptcha token';
    this.logger.error(message, {
      success: result?.success,
      errorCodes: result?.['error-codes'],
    });

    throw new HttpException(message, 400);
  }

  async enableLabeling(
    command: EnableLabelingCommand,
  ): Promise<EnableLabelingResponse> {
    return this.reputationOracleGateway.approveUserAsLabeler(command);
  }

  async getDailyHmtSpent(
    command: DailyHmtSpentCommand,
  ): Promise<DailyHmtSpentResponse> {
    this.checkIfHcaptchaSitekeyPresent(command.siteKey);

    let dailyHmtSpent = await this.cacheManager.get<DailyHmtSpentResponse>(
      DAILY_HMT_SPENT_CACHE_KEY,
    );

    if (!dailyHmtSpent) {
      dailyHmtSpent = await this.hCaptchaLabelingGateway.fetchDailyHmtSpent();
      await this.cacheManager.set(
        DAILY_HMT_SPENT_CACHE_KEY,
        dailyHmtSpent,
        this.configService.cacheTtlDailyHmtSpent,
      );
    }

    return dailyHmtSpent;
  }

  async getUserStats(command: UserStatsCommand): Promise<UserStatsResponse> {
    this.checkIfHcaptchaSitekeyPresent(command.siteKey);

    let stats = await this.cacheManager.get<UserStatsResponse>(command.email);
    if (stats) {
      return stats;
    }

    stats = await this.hCaptchaLabelingGateway.fetchUserStats(command.email);
    await this.cacheManager.set(
      command.email,
      stats,
      this.configService.cacheTtlHCaptchaUserStats,
    );

    return stats;
  }

  private checkIfHcaptchaSitekeyPresent(siteKey: string) {
    if (!siteKey) {
      throw new HttpException('Labeling is not enabled for this account', 400);
    }
  }
}
