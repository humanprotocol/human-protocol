import { Test, TestingModule } from '@nestjs/testing';
import { HCaptchaStatisticsGateway } from '../h-captcha-statistics.gateway';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AxiosRequestConfig } from 'axios';
import { GatewayConfigService } from '../../../common/config/gateway-config.service';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import {
  dailyHmtSpentResponseFixture,
  userStatsApiResponseFixture,
  userStatsResponseFixture,
} from '../../../modules/h-captcha/spec/h-captcha.fixtures';

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HCaptchaStatisticsGateway,
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(statisticsGateway).toBeDefined();
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
        params: {
          api_key: 'mock-api-key',
          actual: false,
          network: 'polygon',
        },
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
