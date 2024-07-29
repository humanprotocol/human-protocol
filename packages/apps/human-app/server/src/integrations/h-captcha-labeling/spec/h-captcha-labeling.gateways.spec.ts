import { Test, TestingModule } from '@nestjs/testing';
import { HCaptchaStatisticsGateway } from '../h-captcha-statistics.gateway';
import { HttpService } from '@nestjs/axios';
import { AutomapperModule } from '@automapper/nestjs';
import { classes } from '@automapper/classes';
import { of } from 'rxjs';
import { AxiosRequestConfig } from 'axios';
import { HCaptchaVerifyMapperProfile } from '../h-captchaverify-mapper-profile.service';
import { GatewayConfigService } from '../../../common/config/gateway-config.service';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import {
  dailyHmtSpentResponseFixture,
  userStatsApiResponseFixture,
  userStatsResponseFixture,
  successfulVerifyTokenApiResponseFixture,
  verifyTokenCommandFixture,
  verifyTokenParamsFixture,
} from '../../../modules/h-captcha/spec/h-captcha.fixtures';
import { hCaptchaGatewayConfigServiceMock } from '../../../common/config/spec/gateway-config-service.mock';
import { HCaptchaVerifyGateway } from '../h-captcha-verify.gateway';
import { toCleanObjParams } from '../../../common/utils/gateway-common.utils';

const httpServiceMock = {
  request: jest.fn(),
};

const environmentConfigServiceMock = {
  hcaptchaLabelingApiKey: 'mock-api-key',
  hcaptchaLabelingStatsApiUrl: 'https://api-statistics.example.com',
  hcaptchaLabelingVerifyApiUrl: 'https://api-verify.example.com',
  reputationOracleUrl: 'https://oracle.example.com',
};

describe('HCaptchaLabelingGateway', () => {
  let statisticsGateway: HCaptchaStatisticsGateway;
  let verifyGateway: HCaptchaVerifyGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AutomapperModule.forRoot({
          strategyInitializer: classes(),
        }),
      ],
      providers: [
        HCaptchaStatisticsGateway,
        HCaptchaVerifyGateway,
        HCaptchaVerifyMapperProfile,
        GatewayConfigService,
        { provide: HttpService, useValue: httpServiceMock },
        {
          provide: EnvironmentConfigService,
          useValue: environmentConfigServiceMock,
        },
      ],
    }).compile();

    statisticsGateway = module.get<HCaptchaStatisticsGateway>(
      HCaptchaStatisticsGateway,
    );
    verifyGateway = module.get<HCaptchaVerifyGateway>(HCaptchaVerifyGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(statisticsGateway).toBeDefined();
  });

  describe('sendTokenToVerify', () => {
    it('should send token to verify successfully and verify mapping', async () => {
      httpServiceMock.request.mockReturnValue(
        of({ data: successfulVerifyTokenApiResponseFixture }),
      );

      const result = await verifyGateway.sendTokenToVerify(
        verifyTokenCommandFixture,
      );
      expect(result).toEqual(successfulVerifyTokenApiResponseFixture);

      const expectedOptions: AxiosRequestConfig = {
        method: 'POST',
        url: `${environmentConfigServiceMock.hcaptchaLabelingVerifyApiUrl}/siteverify`,
        headers: { Authorization: verifyTokenCommandFixture.jwtToken },
        data: {},
        params: toCleanObjParams(verifyTokenParamsFixture),
      };
      expect(httpServiceMock.request).toHaveBeenCalledWith(expectedOptions);
    });
  });

  describe('fetchDailyHmtSpent', () => {
    it('should fetch daily HMT spent successfully', async () => {
      httpServiceMock.request.mockReturnValue(
        of({ data: dailyHmtSpentResponseFixture }),
      );

      const result = await statisticsGateway.fetchDailyHmtSpent();
      expect(result).toEqual(dailyHmtSpentResponseFixture);

      const expectedOptions: AxiosRequestConfig = {
        method: 'GET',
        url: `${environmentConfigServiceMock.hcaptchaLabelingStatsApiUrl}/requester/daily_hmt_spend`,
        headers: {},
        params: { api_key: 'mock-api-key', actual: false },
      };
      expect(httpServiceMock.request).toHaveBeenCalledWith(expectedOptions);
    });
  });

  describe('fetchUserStats', () => {
    it('should fetch user stats successfully and verify mapping', async () => {
      httpServiceMock.request.mockReturnValue(
        of({ data: userStatsApiResponseFixture }),
      );

      const result = await statisticsGateway.fetchUserStats('test@example.com');
      expect(result).toEqual(userStatsResponseFixture);

      const expectedOptions: AxiosRequestConfig = {
        method: 'GET',
        url: `${environmentConfigServiceMock.hcaptchaLabelingStatsApiUrl}/support/labeler/test@example.com`,
        headers: {},
        params: { api_key: 'mock-api-key' },
      };
      expect(httpServiceMock.request).toHaveBeenCalledWith(expectedOptions);
    });
  });
});
