import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import {
  VerifyTokenCommand,
  VerifyTokenApiResponse,
  VerifyTokenResponse,
} from './model/verify-token.model';
import {
  DailyHmtSpentCommand,
  DailyHmtSpentResponse,
} from './model/daily-hmt-spent.model';
import {
  EnableLabelingCommand,
  EnableLabelingResponse,
} from './model/enable-labeling.model';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserStatsCommand, UserStatsResponse } from './model/user-stats.model';
import { Cache } from 'cache-manager';
import { HCaptchaStatisticsGateway } from '../../integrations/h-captcha-labeling/h-captcha-statistics.gateway';
import { ReputationOracleGateway } from '../../integrations/reputation-oracle/reputation-oracle.gateway';
import { HCaptchaVerifyGateway } from '../../integrations/h-captcha-labeling/h-captcha-verify.gateway';

@Injectable()
export class HCaptchaService {
  BAD_REQUEST = 400;
  OK = 200;
  get dailyHmtSpentCacheKey() {
    return 'daily-hmt-spent-cache';
  }
  private readonly logger = new Logger(HCaptchaService.name);
  constructor(
    private configService: EnvironmentConfigService,
    private hCaptchaLabelingGateway: HCaptchaStatisticsGateway,
    private hCaptchaVerifyGateway: HCaptchaVerifyGateway,
    private reputationOracleGateway: ReputationOracleGateway,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async verifyToken(command: VerifyTokenCommand): Promise<VerifyTokenResponse> {
    this.checkIfHcaptchaSitekeyPresent(command.sitekey);
    const response =
      await this.hCaptchaVerifyGateway.sendTokenToVerify(command);
    if (response && response.success) {
      return new VerifyTokenResponse('CAPTCHA was verified successfully');
    }
    const errorMessage = this.createHCaptchaVerificationErrorMessage(response);
    this.logger.error(errorMessage);
    throw new HttpException(errorMessage, 400);
  }
  private createHCaptchaVerificationErrorMessage(
    response: VerifyTokenApiResponse | undefined,
  ): string {
    let message = 'Failed to verify h-captcha token. ';
    if (response) {
      const errorCodes: any = response['error-codes'];
      if (errorCodes && Array.isArray(errorCodes)) {
        message += `Error: ${errorCodes}`;
      } else {
        message += `"error-codes" array is undefined. Response data: ${JSON.stringify(response)}`;
      }
    } else {
      message += 'Failed to process request';
    }
    return message;
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
      this.dailyHmtSpentCacheKey
    );
    if (!dailyHmtSpent) {
      dailyHmtSpent = await this.hCaptchaLabelingGateway.fetchDailyHmtSpent();
      await this.cacheManager.set(
        this.dailyHmtSpentCacheKey,
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
