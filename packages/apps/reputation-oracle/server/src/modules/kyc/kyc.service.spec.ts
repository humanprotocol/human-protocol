import { ConfigService } from '@nestjs/config';
import { ConfigNames } from '../../common/config';
import { Test } from '@nestjs/testing';
import { KYCService } from './kyc.service';
import { HttpService } from '@nestjs/axios';
import { DeepPartial } from 'typeorm';
import { UserService } from '../user/user.service';
import { UserRepository } from '../user/user.repository';
import { createMock } from '@golevelup/ts-jest';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { KYCStatus } from '../../common/enums/user';

describe('KYC Service', () => {
  let kycService: KYCService;
  let userService: UserService;
  let httpService: HttpService;

  beforeAll(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string) => {
        switch (key) {
          case ConfigNames.SYNAPS_API_KEY:
            return 'synaps-api-key';
          case ConfigNames.SYNAPS_WEBHOOK_SECRET:
            return 'synaps-webhook-secret';
        }
      }),
    };

    const mockHttpService: DeepPartial<HttpService> = {
      axiosRef: {
        request: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        KYCService,
        UserService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        { provide: UserRepository, useValue: createMock<UserRepository>() },
      ],
    }).compile();

    kycService = moduleRef.get<KYCService>(KYCService);
    userService = moduleRef.get<UserService>(UserService);
    httpService = moduleRef.get<HttpService>(HttpService);
  });

  describe('initSession', () => {
    it('Should throw an error if user already has an active KYC session', async () => {
      const mockUserEntity = {
        kycSessionId: '123',
      };

      await expect(
        kycService.initSession(mockUserEntity as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('Should start a KYC session for the user', async () => {
      const mockUserEntity = {
        kycSessionId: null,
        email: '123',
      };

      httpService.axiosRef.request = jest.fn().mockResolvedValueOnce({
        data: {
          session_id: '123',
        },
      });

      userService.startKYC = jest.fn().mockResolvedValueOnce(mockUserEntity);

      const result = await kycService.initSession(mockUserEntity as any);

      expect(result).toEqual({
        sessionId: '123',
      });
      expect(httpService.axiosRef.request).toHaveBeenCalledWith({
        method: 'POST',
        url: 'session/init',
        data: {
          alias: '123',
        },
        baseURL: 'https://api.synaps.io/v4',
        headers: {
          'Api-Key': 'synaps-api-key',
        },
      });
      expect(userService.startKYC).toHaveBeenCalledWith(mockUserEntity, '123');
    });
  });

  describe('updateKYCStatus', () => {
    const mockKYCUpdate = {
      reason: '',
      stepId: 'xx',
      service: 'ID DOCUMENT',
      sessionId: '123',
      state: KYCStatus.APPROVED,
    };

    it('Should throw an error if the secret is invalid', async () => {
      await expect(
        kycService.updateKYCStatus('invalid', mockKYCUpdate),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('Should update the KYC status of the user', async () => {
      userService.updateKYCStatus = jest.fn();

      await kycService.updateKYCStatus('synaps-webhook-secret', mockKYCUpdate);

      expect(userService.updateKYCStatus).toHaveBeenCalledWith(
        '123',
        KYCStatus.APPROVED,
      );
    });
  });
});
