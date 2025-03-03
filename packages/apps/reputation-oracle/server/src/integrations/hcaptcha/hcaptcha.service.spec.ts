import { faker } from '@faker-js/faker';
import { HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { ethers } from 'ethers';

import { HCaptchaService } from './hcaptcha.service';
import { HCaptchaConfigService } from '../../config/hcaptcha-config.service';

import {
  createHttpServiceMock,
  createHttpServiceRequestError,
  createHttpServiceResponse,
} from '../../../test/mock-creators/nest';
import { generateEthWallet } from '../../../test/fixtures/web3';

import { mockHCaptchaConfigService } from './fixtures';
import { LabelerData, SiteverifyResponse } from './types';

const mockHttpService = createHttpServiceMock();

describe('hCaptchaService', () => {
  let hcaptchaService: HCaptchaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: HCaptchaConfigService,
          useValue: mockHCaptchaConfigService,
        },
        HCaptchaService,
      ],
    }).compile();

    hcaptchaService = moduleRef.get<HCaptchaService>(HCaptchaService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('verifyToken', () => {
    it('should call configured siteverify URL', async () => {
      await hcaptchaService.verifyToken(faker.string.alphanumeric());

      expect(mockHttpService.post).toHaveBeenCalledTimes(1);
      expect(mockHttpService.post).toHaveBeenCalledWith(
        `${mockHCaptchaConfigService.protectionURL}/siteverify`,
        {},
        {
          params: expect.objectContaining({
            secret: mockHCaptchaConfigService.secret,
            sitekey: mockHCaptchaConfigService.siteKey,
          }),
        },
      );
    });

    it('returns false if response status is not 200', async () => {
      const response: SiteverifyResponse = {
        success: true,
      };
      mockHttpService.post.mockReturnValueOnce(
        createHttpServiceResponse(204, response),
      );

      const result = await hcaptchaService.verifyToken(
        faker.string.alphanumeric(),
      );

      expect(result).toBe(false);
    });

    it('returns false if 200 but verification is not successfull', async () => {
      const response: SiteverifyResponse = {
        success: false,
      };

      mockHttpService.post.mockReturnValueOnce(
        createHttpServiceResponse(200, response),
      );

      const result = await hcaptchaService.verifyToken(
        faker.string.alphanumeric(),
      );

      expect(result).toBe(false);
    });

    it('returns false if response has no data', async () => {
      mockHttpService.post.mockReturnValueOnce(createHttpServiceResponse(200));

      const result = await hcaptchaService.verifyToken(
        faker.string.alphanumeric(),
      );

      expect(result).toBe(false);
    });

    it('returns false if API request fails', async () => {
      mockHttpService.post.mockReturnValueOnce(
        createHttpServiceRequestError(new Error()),
      );

      const result = await hcaptchaService.verifyToken(
        faker.string.alphanumeric(),
      );

      expect(result).toBe(false);
    });

    it('should not attach ip and pass verification', async () => {
      const testToken = faker.string.alphanumeric();

      const response: SiteverifyResponse = {
        success: true,
      };

      mockHttpService.post.mockReturnValueOnce(
        createHttpServiceResponse(200, response),
      );

      const result = await hcaptchaService.verifyToken(testToken);

      expect(result).toBe(true);
      expect(mockHttpService.post).toHaveBeenCalledTimes(1);

      const requestConfigArg = mockHttpService.post.mock.calls[0][2];
      expect(requestConfigArg).toEqual({
        params: expect.objectContaining({
          response: testToken,
        }),
      });
      expect(requestConfigArg).not.toHaveProperty('params.remoteip');
    });

    it('should attach ip and pass verification', async () => {
      const testToken = faker.string.alphanumeric();
      const testIp = faker.internet.ip();

      const response: SiteverifyResponse = {
        success: true,
      };

      mockHttpService.post.mockReturnValueOnce(
        createHttpServiceResponse(200, response),
      );

      const result = await hcaptchaService.verifyToken(testToken, testIp);

      expect(result).toBe(true);

      expect(mockHttpService.post).toHaveBeenCalledWith(
        expect.any(String),
        {},
        {
          params: expect.objectContaining({
            response: testToken,
            remoteip: testIp,
          }),
        },
      );
    });
  });

  describe('registerLabeler', () => {
    it('should call configured labeler registration URL', async () => {
      await hcaptchaService.registerLabeler({
        email: faker.internet.email(),
        evmAddress: generateEthWallet().address,
      });

      expect(mockHttpService.post).toHaveBeenCalledTimes(1);
      expect(mockHttpService.post).toHaveBeenCalledWith(
        `${mockHCaptchaConfigService.labelingURL}/labeler/register`,
        expect.objectContaining({
          language: mockHCaptchaConfigService.defaultLabelerLang,
        }),
        {
          params: expect.objectContaining({
            api_key: mockHCaptchaConfigService.apiKey,
          }),
        },
      );
    });

    it('returns false if response is not 200', async () => {
      mockHttpService.post.mockReturnValueOnce(createHttpServiceResponse(204));

      const result = await hcaptchaService.registerLabeler({
        email: faker.internet.email(),
        evmAddress: generateEthWallet().address,
      });
      expect(result).toBe(false);
    });

    it('returns false if API request fails', async () => {
      mockHttpService.post.mockReturnValueOnce(
        createHttpServiceRequestError(new Error()),
      );

      const result = await hcaptchaService.registerLabeler({
        email: faker.internet.email(),
        evmAddress: generateEthWallet().address,
      });

      expect(result).toBe(false);
    });

    it('should not attach ip and register labeler', async () => {
      const testEmail = faker.internet.email();
      const testEvmAddress = generateEthWallet().address;
      const testCountry = faker.location.countryCode();

      mockHttpService.post.mockReturnValueOnce(createHttpServiceResponse(200));

      const result = await hcaptchaService.registerLabeler({
        email: testEmail,
        evmAddress: testEvmAddress,
        country: testCountry,
      });

      expect(result).toBe(true);
      expect(mockHttpService.post).toHaveBeenCalledTimes(1);

      const [requestUrl, requestBodyArg, requestConfigArg] =
        mockHttpService.post.mock.calls[0];

      expect(requestUrl).toEqual(expect.any(String));
      expect(requestBodyArg).toEqual(
        expect.objectContaining({
          email: testEmail,
          eth_addr: testEvmAddress,
          country: testCountry,
        }),
      );
      expect(requestConfigArg).not.toHaveProperty('params.remoteip');
    });

    it('should attach ip and register labeler', async () => {
      const testEmail = faker.internet.email();
      const testEvmAddress = generateEthWallet().address;
      const testIp = faker.internet.ip();

      mockHttpService.post.mockReturnValueOnce(createHttpServiceResponse(200));

      const result = await hcaptchaService.registerLabeler({
        email: testEmail,
        evmAddress: testEvmAddress,
        ip: testIp,
      });

      expect(result).toBe(true);

      expect(mockHttpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          email: testEmail,
          eth_addr: testEvmAddress,
        }),
        {
          params: expect.objectContaining({
            remoteip: testIp,
          }),
        },
      );
    });

    it('should normalize evm address and register labeler', async () => {
      const testEvmAddress = generateEthWallet().address.toLowerCase();

      mockHttpService.post.mockReturnValueOnce(createHttpServiceResponse(200));

      const result = await hcaptchaService.registerLabeler({
        email: faker.internet.email(),
        evmAddress: testEvmAddress,
      });

      expect(result).toBe(true);

      expect(mockHttpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          eth_addr: ethers.getAddress(testEvmAddress),
        }),
        expect.any(Object),
      );
    });
  });

  describe('getLabelerData', () => {
    it('should call configured get labeler URL', async () => {
      await hcaptchaService.getLabelerData(faker.internet.email());

      expect(mockHttpService.get).toHaveBeenCalledTimes(1);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        `${mockHCaptchaConfigService.labelingURL}/support/users`,
        {
          params: expect.objectContaining({
            api_key: mockHCaptchaConfigService.apiKey,
          }),
        },
      );
    });

    it('should retrieve labeler data successfully', async () => {
      const testEmail = faker.internet.email();

      const response: LabelerData = {
        sitekeys: [
          {
            sitekey: faker.string.uuid(),
          },
        ],
      };

      mockHttpService.get.mockReturnValueOnce(
        createHttpServiceResponse(200, response),
      );

      const result = await hcaptchaService.getLabelerData(testEmail);

      expect(result).toBe(response);
      expect(mockHttpService.get).toHaveBeenCalledTimes(1);
      expect(mockHttpService.get).toHaveBeenCalledWith(expect.any(String), {
        params: expect.objectContaining({
          email: testEmail,
        }),
      });
    });

    it('returns null if API response status is not 200', async () => {
      mockHttpService.get.mockReturnValueOnce(
        createHttpServiceResponse(204, {}),
      );

      const result = await hcaptchaService.getLabelerData(
        faker.internet.email(),
      );

      expect(result).toBe(null);
    });

    it('should return null if API response does not contain data', async () => {
      mockHttpService.get.mockReturnValueOnce(createHttpServiceResponse(200));

      const result = await hcaptchaService.getLabelerData(
        faker.internet.email(),
      );

      expect(result).toBe(null);
    });

    it('returns null if API request fails', async () => {
      mockHttpService.get.mockReturnValueOnce(
        createHttpServiceRequestError(new Error()),
      );

      const result = await hcaptchaService.getLabelerData(
        faker.internet.email(),
      );

      expect(result).toBe(null);
    });
  });
});
