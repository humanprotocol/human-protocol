import { ConfigService } from '@nestjs/config';
import { ConfigNames } from '../../common/config';
import { Test } from '@nestjs/testing';
import { KycService } from './kyc.service';
import { HttpService } from '@nestjs/axios';
import { DeepPartial } from 'typeorm';
import { createMock } from '@golevelup/ts-jest';
import { UnauthorizedException } from '@nestjs/common';
import { KycStatus } from '../../common/enums/user';
import { KycRepository } from './kyc.repository';
import { KycEntity } from './kyc.entity';

describe('Kyc Service', () => {
  let kycService: KycService;
  let httpService: HttpService;
  let kycRepository: KycRepository;

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
        KycService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        { provide: KycRepository, useValue: createMock<KycRepository>() },
      ],
    }).compile();

    httpService = moduleRef.get<HttpService>(HttpService);
    kycService = moduleRef.get<KycService>(KycService);
    kycRepository = moduleRef.get<KycRepository>(KycRepository);
  });

  describe('initSession', () => {
    it('Should return existing session id if user already has an active Kyc session', async () => {
      const mockUserEntity = {
        kyc: {
          sessionId: '123',
        },
      };

      const result = await kycService.initSession(mockUserEntity as any);

      expect(result).toEqual({
        sessionId: '123',
      });
    });

    it('Should start a Kyc session for the user', async () => {
      const mockUserEntity = {
        kyc: {
          sessionId: null,
        },
        id: 1,
        email: 'test@example.com',
      };

      httpService.axiosRef.request = jest.fn().mockResolvedValueOnce({
        data: {
          session_id: '123',
        },
      });

      jest.spyOn(kycRepository, 'create').mockResolvedValue({} as KycEntity);

      const result = await kycService.initSession(mockUserEntity as any);

      expect(result).toEqual({
        sessionId: '123',
      });
      expect(httpService.axiosRef.request).toHaveBeenCalledWith({
        method: 'POST',
        url: 'session/init',
        data: {
          alias: 'test@example.com',
        },
        baseURL: 'https://api.synaps.io/v4',
        headers: {
          'Api-Key': 'synaps-api-key',
        },
      });
      expect(kycRepository.create).toHaveBeenCalledWith({
        sessionId: '123',
        status: KycStatus.NONE,
        userId: 1,
      });
    });
  });

  describe('updateKycStatus', () => {
    const mockKycUpdate = {
      reason: '',
      stepId: 'xx',
      service: 'ID DOCUMENT',
      sessionId: '123',
      state: KycStatus.APPROVED,
    };

    it('Should throw an error if the secret is invalid', async () => {
      await expect(
        kycService.updateKycStatus('invalid', mockKycUpdate),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('Should update the Kyc status of the user', async () => {
      jest.spyOn(kycRepository, 'updateOne').mockResolvedValue({} as any);

      await kycService.updateKycStatus('synaps-webhook-secret', mockKycUpdate);

      expect(kycRepository.updateOne).toHaveBeenCalledWith(
        { sessionId: '123' },
        { status: KycStatus.APPROVED },
      );
    });
  });
});
