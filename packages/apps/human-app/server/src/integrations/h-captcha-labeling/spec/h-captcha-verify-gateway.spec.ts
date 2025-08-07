import { HttpService } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosRequestConfig } from 'axios';
import { of } from 'rxjs';
import { EnvironmentConfigService } from '../../../common/config/environment-config.service';
import { GatewayConfigService } from '../../../common/config/gateway-config.service';
import { toCleanObjParams } from '../../../common/utils/gateway-common.utils';
import {
  successfulVerifyTokenApiResponseFixture,
  verifyTokenCommandFixture,
  verifyTokenParamsFixture,
} from '../../../modules/h-captcha/spec/h-captcha.fixtures';
import { HCaptchaVerifyGateway } from '../h-captcha-verify.gateway';

const httpServiceMock = {
  request: jest.fn(),
};

const environmentConfigServiceMock = {
  hcaptchaLabelingApiKey: 'mock-api-key',
  hcaptchaLabelingStatsApiUrl: 'https://api-statistics.example.com',
  hcaptchaLabelingVerifyApiUrl: 'https://api-verify.example.com',
  reputationOracleUrl: 'https://oracle.example.com',
};

describe('HCaptchaVerifyGateway', () => {
  let verifyGateway: HCaptchaVerifyGateway;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HCaptchaVerifyGateway,
        GatewayConfigService,
        { provide: HttpService, useValue: httpServiceMock },
        {
          provide: EnvironmentConfigService,
          useValue: environmentConfigServiceMock,
        },
      ],
    }).compile();

    verifyGateway = module.get<HCaptchaVerifyGateway>(HCaptchaVerifyGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(verifyGateway).toBeDefined();
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
});
