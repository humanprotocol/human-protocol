import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { HCaptchaService } from '../h-captcha.service';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import { HCaptchaStatisticsGateway } from '../../../integrations/h-captcha-labeling/h-captcha-statistics.gateway';
import { ReputationOracleGateway } from '../../../integrations/reputation-oracle/reputation-oracle.gateway';
import {
  VerifyTokenCommand,
  VerifyTokenApiResponse,
  VerifyTokenResponse,
} from '../model/verify-token.model';
import { DailyHmtSpentCommand } from '../model/daily-hmt-spent.model';
import {
  EnableLabelingCommand,
  EnableLabelingResponse,
} from '../model/enable-labeling.model';
import { UserStatsCommand } from '../model/user-stats.model';
import {
  hCaptchaUserStatsCommandFixture,
  enableLabelingCommandFixture,
  verifyTokenCommandFixture,
  dailyHmtSpentCommandFixture,
  successfulVerifyTokenApiResponseFixture,
  dailyHmtSpentResponseFixture,
  userStatsResponseFixture,
  unsuccessfulVerifyTokenApiResponseWithErrorCodesFixture,
  unsuccessfulVerifyTokenApiResponseWithoutErrorCodesFixture,
  unsuccessfulVerifyTokenApiResponseWithUndefinedErrorCodesFixture,
  errorMessagesFixture,
} from './h-captcha.fixtures';
import {
  hCaptchaStatisticsGatewayMock,
  hCaptchaVerifyGatewayMock,
} from '../../../integrations/h-captcha-labeling/spec/h-captcha-statistics-gateway.mock';
import { HCaptchaVerifyGateway } from '../../../integrations/h-captcha-labeling/h-captcha-verify.gateway';

describe('HCaptchaService', () => {
  let service: HCaptchaService;
  let cacheManager: Cache;
  let configService: EnvironmentConfigService;
  let hCaptchaStatisticsGateway: HCaptchaStatisticsGateway;
  let hCaptchaVerifyGateway: HCaptchaVerifyGateway;
  let reputationOracleGateway: ReputationOracleGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HCaptchaService,
        {
          provide: EnvironmentConfigService,
          useValue: {
            cacheTtlDailyHmtSpent: 3600,
            cacheTtlHCaptchaUserStats: 3600,
          },
        },
        {
          provide: HCaptchaStatisticsGateway,
          useValue: hCaptchaStatisticsGatewayMock,
        },
        {
          provide: HCaptchaVerifyGateway,
          useValue: hCaptchaVerifyGatewayMock,
        },
        {
          provide: ReputationOracleGateway,
          useValue: {
            approveUserAsLabeler: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HCaptchaService>(HCaptchaService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    configService = module.get<EnvironmentConfigService>(
      EnvironmentConfigService,
    );
    hCaptchaStatisticsGateway = module.get<HCaptchaStatisticsGateway>(
      HCaptchaStatisticsGateway,
    );
    hCaptchaVerifyGateway = module.get<HCaptchaVerifyGateway>(
      HCaptchaVerifyGateway,
    );
    reputationOracleGateway = module.get<ReputationOracleGateway>(
      ReputationOracleGateway,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('verifyToken', () => {
    it('should verify token successfully', async () => {
      const command: VerifyTokenCommand = verifyTokenCommandFixture;
      jest
        .spyOn(hCaptchaVerifyGateway, 'sendTokenToVerify')
        .mockResolvedValue(successfulVerifyTokenApiResponseFixture);

      const result = await service.verifyToken(command);
      expect(result).toEqual(
        new VerifyTokenResponse('CAPTCHA was verified successfully'),
      );
    });

    it('should throw an error if verification fails with error codes', async () => {
      const command: VerifyTokenCommand = verifyTokenCommandFixture;
      const apiResponse: VerifyTokenApiResponse =
        unsuccessfulVerifyTokenApiResponseWithErrorCodesFixture;
      const errorMessage = errorMessagesFixture.withErrorCodes;

      jest
        .spyOn(hCaptchaVerifyGateway, 'sendTokenToVerify')
        .mockResolvedValue(apiResponse);

      await expect(service.verifyToken(command)).rejects.toThrowError(
        errorMessage,
      );
    });

    it('should throw an error if verification fails without error codes', async () => {
      const command: VerifyTokenCommand = verifyTokenCommandFixture;
      const apiResponse: VerifyTokenApiResponse =
        unsuccessfulVerifyTokenApiResponseWithoutErrorCodesFixture;
      const errorMessage = errorMessagesFixture.withUndefinedErrorCodes;

      jest
        .spyOn(hCaptchaVerifyGateway, 'sendTokenToVerify')
        .mockResolvedValue(apiResponse);

      await expect(service.verifyToken(command)).rejects.toThrowError(
        errorMessage,
      );
    });

    it('should throw an error if verification fails with undefined error codes', async () => {
      const command: VerifyTokenCommand = verifyTokenCommandFixture;
      const apiResponse: VerifyTokenApiResponse =
        unsuccessfulVerifyTokenApiResponseWithUndefinedErrorCodesFixture;
      const errorMessage = errorMessagesFixture.withUndefinedErrorCodes;

      jest
        .spyOn(hCaptchaVerifyGateway, 'sendTokenToVerify')
        .mockResolvedValue(apiResponse);

      await expect(service.verifyToken(command)).rejects.toThrowError(
        errorMessage,
      );
    });
  });

  describe('enableLabeling', () => {
    it('should enable labeling successfully', async () => {
      const command: EnableLabelingCommand = enableLabelingCommandFixture;
      const response: EnableLabelingResponse = { message: 'Labeling enabled' };

      jest
        .spyOn(reputationOracleGateway, 'approveUserAsLabeler')
        .mockResolvedValue(response);

      const result = await service.enableLabeling(command);
      expect(result).toEqual(response);
    });
  });

  describe('getDailyHmtSpent', () => {
    it('should return daily HMT spent from cache if available', async () => {
      const command: DailyHmtSpentCommand = dailyHmtSpentCommandFixture;
      jest
        .spyOn(cacheManager, 'get')
        .mockResolvedValue(dailyHmtSpentResponseFixture);

      const result = await service.getDailyHmtSpent(command);
      expect(result).toEqual(dailyHmtSpentResponseFixture);
    });

    it('should fetch and cache daily HMT spent if not in cache', async () => {
      const command: DailyHmtSpentCommand = dailyHmtSpentCommandFixture;

      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      jest
        .spyOn(hCaptchaStatisticsGateway, 'fetchDailyHmtSpent')
        .mockResolvedValue(dailyHmtSpentResponseFixture);

      const result = await service.getDailyHmtSpent(command);
      expect(result).toEqual(dailyHmtSpentResponseFixture);
      expect(cacheManager.set).toHaveBeenCalledWith(
        service.dailyHmtSpentCacheKey,
        dailyHmtSpentResponseFixture,
        { ttl: configService.cacheTtlDailyHmtSpent },
      );
    });
  });

  describe('getUserStats', () => {
    it('should return user stats from cache if available', async () => {
      const command: UserStatsCommand = hCaptchaUserStatsCommandFixture;
      jest
        .spyOn(cacheManager, 'get')
        .mockResolvedValue(userStatsResponseFixture);

      const result = await service.getUserStats(command);
      expect(result).toEqual(userStatsResponseFixture);
    });

    it('should fetch and cache user stats if not in cache', async () => {
      const command: UserStatsCommand = hCaptchaUserStatsCommandFixture;

      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      jest
        .spyOn(hCaptchaStatisticsGateway, 'fetchUserStats')
        .mockResolvedValue(userStatsResponseFixture);

      const result = await service.getUserStats(command);
      expect(result).toEqual(userStatsResponseFixture);
      expect(cacheManager.set).toHaveBeenCalledWith(
        command.email,
        userStatsResponseFixture,
        { ttl: configService.cacheTtlHCaptchaUserStats },
      );
    });
  });
});
