import axios from 'axios';
import { HCaptchaService } from './hcaptcha.service';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HCaptchaConfigService } from '../../common/config/hcaptcha-config.service';
import { DeepPartial } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { of, firstValueFrom } from 'rxjs';
import {
  MOCK_HCAPTCHA_PROTECTION_URL,
  MOCK_HCAPTCHA_LABELING_URL,
} from '../../../test/constants';
import { TokenType } from '../../common/enums';

jest.mock('rxjs', () => {
  const originalModule = jest.requireActual('rxjs');
  return {
    ...originalModule,
    firstValueFrom: jest.fn(),
  };
});

describe('hCaptchaService', () => {
  let hcaptchaService: HCaptchaService;
  let httpService: HttpService;

  beforeAll(async () => {
    const mockHttpService: DeepPartial<HttpService> = {
      axiosRef: {
        get: jest.fn(),
        post: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        HCaptchaService,
        ConfigService,
        HCaptchaConfigService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    httpService = moduleRef.get<HttpService>(HttpService);
    hcaptchaService = moduleRef.get<HCaptchaService>(HCaptchaService);
  });

  describe('verifyToken', () => {
    it('should verify hCaptcha auth token successfully', async () => {
      const mockData = {
        ip: '127.0.0.1',
        token: 'token',
        type: TokenType.AUTH,
      };

      const mockResponseData = { success: true };

      httpService.post = jest.fn().mockImplementation(() => {
        return of({
          status: 200,
          data: mockResponseData,
        });
      });

      (firstValueFrom as jest.Mock).mockResolvedValue({
        status: 200,
        data: mockResponseData,
      });

      const result = await hcaptchaService.verifyToken(mockData);

      expect(result).toEqual(mockResponseData);
      expect(httpService.post).toHaveBeenCalledWith(
        `${MOCK_HCAPTCHA_PROTECTION_URL}/siteverify`,
        {},
        { params: expect.any(Object) },
      );
    });

    it('should verify hCaptcha auth token successfully without IP', async () => {
      const mockData = {
        url: 'https://example.com',
        secret: 'secret-key',
        sitekey: 'site-key',
        token: 'token',
        type: TokenType.AUTH,
      };

      const mockResponseData = { success: true };

      httpService.post = jest.fn().mockImplementation(() => {
        return of({
          status: 200,
          data: mockResponseData,
        });
      });

      (firstValueFrom as jest.Mock).mockResolvedValue({
        status: 200,
        data: mockResponseData,
      });

      const result = await hcaptchaService.verifyToken(mockData);

      expect(result).toEqual(mockResponseData);
      expect(httpService.post).toHaveBeenCalledWith(
        `${MOCK_HCAPTCHA_PROTECTION_URL}/siteverify`,
        {},
        { params: expect.any(Object) },
      );
    });

    it('should verify hCaptcha labeling token successfully', async () => {
      const mockData = {
        ip: '127.0.0.1',
        token: 'token',
        type: TokenType.EXCHANGE,
      };

      const mockResponseData = { success: true };

      httpService.post = jest.fn().mockImplementation(() => {
        return of({
          status: 200,
          data: mockResponseData,
        });
      });

      (firstValueFrom as jest.Mock).mockResolvedValue({
        status: 200,
        data: mockResponseData,
      });

      const result = await hcaptchaService.verifyToken(mockData);

      expect(result).toEqual(mockResponseData);
      expect(httpService.post).toHaveBeenCalledWith(
        `${MOCK_HCAPTCHA_PROTECTION_URL}/siteverify`,
        {},
        { params: expect.any(Object) },
      );
    });

    it('should verify hCaptcha labeling token successfully without IP', async () => {
      const mockData = {
        url: 'https://example.com',
        secret: 'secret-key',
        sitekey: 'site-key',
        token: 'token',
        type: TokenType.EXCHANGE,
      };

      const mockResponseData = { success: true };

      httpService.post = jest.fn().mockImplementation(() => {
        return of({
          status: 200,
          data: mockResponseData,
        });
      });

      (firstValueFrom as jest.Mock).mockResolvedValue({
        status: 200,
        data: mockResponseData,
      });

      const result = await hcaptchaService.verifyToken(mockData);

      expect(result).toEqual(mockResponseData);
      expect(httpService.post).toHaveBeenCalledWith(
        `${MOCK_HCAPTCHA_PROTECTION_URL}/siteverify`,
        {},
        { params: expect.any(Object) },
      );
    });

    it('should return false if API response status is not 200', async () => {
      const mockData = {
        url: 'https://example.com',
        secret: 'secret-key',
        sitekey: 'site-key',
        token: 'token',
        type: TokenType.AUTH,
      };

      const mockResponseData = { success: false };

      httpService.post = jest.fn().mockImplementation(() => {
        return of({
          status: 400,
          data: mockResponseData,
        });
      });

      (firstValueFrom as jest.Mock).mockResolvedValue({
        status: 400,
        data: mockResponseData,
      });

      const result = await hcaptchaService.verifyToken(mockData);

      expect(result).toEqual(false);
      expect(httpService.post).toHaveBeenCalledWith(
        `${MOCK_HCAPTCHA_PROTECTION_URL}/siteverify`,
        {},
        { params: expect.any(Object) },
      );
    });

    it('should return false if API response does not contain data', async () => {
      const mockData = {
        url: 'https://example.com',
        secret: 'secret-key',
        sitekey: 'site-key',
        token: 'token',
        type: TokenType.AUTH,
      };

      httpService.post = jest.fn().mockImplementation(() => {
        return of({
          status: 200,
        });
      });

      (firstValueFrom as jest.Mock).mockResolvedValue({
        status: 200,
      });

      const result = await hcaptchaService.verifyToken(mockData);

      expect(result).toEqual(false);
      expect(httpService.post).toHaveBeenCalledWith(
        `${MOCK_HCAPTCHA_PROTECTION_URL}/siteverify`,
        {},
        { params: expect.any(Object) },
      );
    });

    it('should return false if API request fails', async () => {
      const mockData = {
        url: 'https://example.com',
        secret: 'secret-key',
        sitekey: 'site-key',
        token: 'token',
        type: TokenType.AUTH,
      };

      httpService.post = jest.fn().mockImplementation(() => {
        return of({
          status: 401,
        });
      });

      (firstValueFrom as jest.Mock).mockRejectedValue(
        new Error('Network Error'),
      );

      const result = await hcaptchaService.verifyToken(mockData);

      expect(result).toEqual(false);
      expect(httpService.post).toHaveBeenCalledWith(
        `${MOCK_HCAPTCHA_PROTECTION_URL}/siteverify`,
        {},
        { params: expect.any(Object) },
      );
    });
  });

  describe('registerLabeler', () => {
    it('should register labeler successfully', async () => {
      const mockData = {
        url: 'https://example.com',
        apiKey: 'api-key',
        ip: '127.0.0.1',
        email: 'test@example.com',
        language: 'en',
        country: 'US',
        address: '0xabcdef1234567890',
      };

      httpService.post = jest.fn().mockImplementation(() => {
        return of({
          status: 200,
        });
      });

      (firstValueFrom as jest.Mock).mockResolvedValue({
        status: 200,
      });

      const result = await hcaptchaService.registerLabeler(mockData);

      expect(result).toEqual(true);
      expect(httpService.post).toHaveBeenCalledWith(
        `${MOCK_HCAPTCHA_LABELING_URL}/labeler/register`,
        expect.any(Object),
        { params: expect.any(Object) },
      );
    });

    it('should register labeler successfully without IP', async () => {
      const mockData = {
        url: 'https://example.com',
        apiKey: 'api-key',
        email: 'test@example.com',
        language: 'en',
        country: 'US',
        address: '0xabcdef1234567890',
      };

      httpService.post = jest.fn().mockImplementation(() => {
        return of({
          status: 200,
        });
      });

      (firstValueFrom as jest.Mock).mockResolvedValue({
        status: 200,
      });

      const result = await hcaptchaService.registerLabeler(mockData);

      expect(result).toEqual(true);
      expect(httpService.post).toHaveBeenCalledWith(
        `${MOCK_HCAPTCHA_LABELING_URL}/labeler/register`,
        expect.any(Object),
        { params: expect.any(Object) },
      );
    });

    it('should return false if API response status is not 200', async () => {
      const mockData = {
        url: 'https://example.com',
        apiKey: 'api-key',
        ip: '127.0.0.1',
        email: 'test@example.com',
        language: 'en',
        country: 'US',
        address: '0xabcdef1234567890',
      };

      httpService.post = jest.fn().mockImplementation(() => {
        return of({
          status: 400,
        });
      });

      (firstValueFrom as jest.Mock).mockResolvedValue({
        status: 400,
      });

      const result = await hcaptchaService.registerLabeler(mockData);

      expect(result).toEqual(false);
      expect(httpService.post).toHaveBeenCalledWith(
        `${MOCK_HCAPTCHA_LABELING_URL}/labeler/register`,
        expect.any(Object),
        { params: expect.any(Object) },
      );
    });

    it('should return false if API request fails', async () => {
      const mockData = {
        url: 'https://example.com',
        apiKey: 'api-key',
        ip: '127.0.0.1',
        email: 'test@example.com',
        language: 'en',
        country: 'US',
        address: '0xabcdef1234567890',
      };

      httpService.post = jest.fn().mockImplementation(() => {
        return of({
          status: 401,
        });
      });

      (firstValueFrom as jest.Mock).mockRejectedValue(
        new Error('Network Error'),
      );

      const result = await hcaptchaService.registerLabeler(mockData);

      expect(result).toEqual(false);
      expect(httpService.post).toHaveBeenCalledWith(
        `${MOCK_HCAPTCHA_LABELING_URL}/labeler/register`,
        expect.any(Object),
        { params: expect.any(Object) },
      );
    });
  });

  describe('getLabelerData', () => {
    it('should retrieve labeler data successfully', async () => {
      const mockData = {
        email: 'test@example.com',
      };

      const mockResponseData = { labelerData: 'data' };

      httpService.get = jest.fn().mockImplementation(() => {
        return of({
          status: 200,
          data: mockResponseData,
        });
      });

      (firstValueFrom as jest.Mock).mockResolvedValue({
        status: 200,
        data: mockResponseData,
      });

      const result = await hcaptchaService.getLabelerData(mockData);

      expect(result).toEqual(mockResponseData);
      expect(httpService.get).toHaveBeenCalledWith(
        `${MOCK_HCAPTCHA_LABELING_URL}/support/users`,
        {
          params: expect.any(Object),
        },
      );
    });

    it('should return null if API response status is not 200', async () => {
      const mockData = {
        url: 'https://example.com',
        apiKey: 'api-key',
        email: 'test@example.com',
      };

      const mockResponseData = { labelerData: 'data' };

      httpService.get = jest.fn().mockImplementation(() => {
        return of({
          status: 400,
          data: mockResponseData,
        });
      });

      (firstValueFrom as jest.Mock).mockResolvedValue({
        status: 400,
        data: mockResponseData,
      });

      const result = await hcaptchaService.getLabelerData(mockData);

      expect(result).toEqual(null);
      expect(httpService.get).toHaveBeenCalledWith(
        `${MOCK_HCAPTCHA_LABELING_URL}/support/users`,
        {
          params: expect.any(Object),
        },
      );
    });

    it('should return null if API response does not contain data', async () => {
      const mockData = {
        url: 'https://example.com',
        apiKey: 'api-key',
        email: 'test@example.com',
      };

      httpService.get = jest.fn().mockImplementation(() => {
        return of({
          status: 200,
        });
      });

      (firstValueFrom as jest.Mock).mockResolvedValue({
        status: 200,
      });

      const result = await hcaptchaService.getLabelerData(mockData);

      expect(result).toEqual(null);
      expect(httpService.get).toHaveBeenCalledWith(
        `${MOCK_HCAPTCHA_LABELING_URL}/support/users`,
        {
          params: expect.any(Object),
        },
      );
    });

    it('should return null if API request fails', async () => {
      const mockData = {
        url: 'https://example.com',
        apiKey: 'api-key',
        email: 'test@example.com',
      };

      httpService.post = jest.fn().mockImplementation(() => {
        return of({
          status: 400,
        });
      });

      (firstValueFrom as jest.Mock).mockRejectedValue(
        new Error('Network Error'),
      );

      const result = await hcaptchaService.getLabelerData(mockData);

      expect(result).toEqual(null);
      expect(httpService.get).toHaveBeenCalledWith(
        `${MOCK_HCAPTCHA_LABELING_URL}/support/users`,
        {
          params: expect.any(Object),
        },
      );
    });
  });
});
