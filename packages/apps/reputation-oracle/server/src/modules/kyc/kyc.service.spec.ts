import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { KycService } from './kyc.service';
import { HttpService } from '@nestjs/axios';
import { DeepPartial } from 'typeorm';
import { createMock } from '@golevelup/ts-jest';
import { HttpStatus } from '@nestjs/common';
import { KycStatus } from '../../common/enums/user';
import { KycRepository } from './kyc.repository';
import { KycEntity } from './kyc.entity';
import { of } from 'rxjs';
import { ErrorKyc } from '../../common/constants/errors';
import { SynapsConfigService } from '../../common/config/synaps-config.service';
import { ControlledError } from '../../common/errors/controlled';

describe('Kyc Service', () => {
  let kycService: KycService;
  let httpService: HttpService;
  let kycRepository: KycRepository;
  let synapsConfigService: SynapsConfigService;

  beforeAll(async () => {
    const mockHttpService: DeepPartial<HttpService> = {
      axiosRef: {
        request: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        KycService,
        ConfigService,
        SynapsConfigService,
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
    synapsConfigService =
      moduleRef.get<SynapsConfigService>(SynapsConfigService);

    jest
      .spyOn(SynapsConfigService.prototype, 'apiKey', 'get')
      .mockReturnValue('test');
  });

  describe('initSession', () => {
    describe('Should return existing session id if user already has an active Kyc session, and is waiting for user to make an action', () => {
      it('status is NONE', async () => {
        const mockUserEntity = {
          kyc: {
            sessionId: '123',
            status: KycStatus.NONE,
          },
        };

        const result = await kycService.initSession(mockUserEntity as any);

        expect(result).toEqual({
          sessionId: '123',
        });
      });

      it('status is SUBMISSION_REQUIRED', async () => {
        const mockUserEntity = {
          kyc: {
            sessionId: '123',
            status: KycStatus.SUBMISSION_REQUIRED,
          },
        };

        const result = await kycService.initSession(mockUserEntity as any);

        expect(result).toEqual({
          sessionId: '123',
        });
      });

      it('status is RESUBMISSION_REQUIRED', async () => {
        const mockUserEntity = {
          kyc: {
            sessionId: '123',
            status: KycStatus.RESUBMISSION_REQUIRED,
          },
        };

        const result = await kycService.initSession(mockUserEntity as any);

        expect(result).toEqual({
          sessionId: '123',
        });
      });

      it('status is RESET', async () => {
        const mockUserEntity = {
          kyc: {
            sessionId: '123',
            status: KycStatus.RESET,
          },
        };

        const result = await kycService.initSession(mockUserEntity as any);

        expect(result).toEqual({
          sessionId: '123',
        });
      });
    });

    it('Should throw an error if user already has an active Kyc session, but is approved already', async () => {
      const mockUserEntity = {
        kyc: {
          sessionId: '123',
          status: KycStatus.APPROVED,
        },
      };

      await expect(
        kycService.initSession(mockUserEntity as any),
      ).rejects.toThrow(
        new ControlledError(ErrorKyc.AlreadyApproved, HttpStatus.BAD_REQUEST),
      );
    });

    it("Should throw an error if user already has an active Kyc session, but it's pending verification", async () => {
      const mockUserEntity = {
        kyc: {
          sessionId: '123',
          status: KycStatus.PENDING_VERIFICATION,
        },
      };

      await expect(
        kycService.initSession(mockUserEntity as any),
      ).rejects.toThrow(
        new ControlledError(
          ErrorKyc.VerificationInProgress,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it("Should throw an error if user already has an active Kyc session, but it's rejected", async () => {
      const mockUserEntity = {
        kyc: {
          sessionId: '123',
          status: KycStatus.REJECTED,
          message: 'test',
        },
      };

      await expect(
        kycService.initSession(mockUserEntity as any),
      ).rejects.toThrow(
        new ControlledError(
          `${ErrorKyc.Rejected}. Reason: ${mockUserEntity.kyc.message}`,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it("Should throw an error if synaps doesn't return a session id", async () => {
      const mockUserEntity = {
        kyc: {
          sessionId: null,
        },
      };

      httpService.post = jest.fn().mockImplementation(() => {
        return of({
          data: {},
        });
      });

      await expect(
        kycService.initSession(mockUserEntity as any),
      ).rejects.toThrow(
        new ControlledError(
          ErrorKyc.InvalidSynapsAPIResponse,
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('Should start a Kyc session for the user', async () => {
      const mockUserEntity = {
        kyc: {
          sessionId: null,
        },
        id: 1,
        email: 'test@example.com',
      };

      httpService.post = jest.fn().mockImplementation(() => {
        return of({
          data: {
            session_id: '123',
          },
        });
      });

      jest
        .spyOn(kycRepository, 'createUnique')
        .mockResolvedValue({} as KycEntity);

      const result = await kycService.initSession(mockUserEntity as any);

      expect(result).toEqual({
        sessionId: '123',
      });
      expect(httpService.post).toHaveBeenCalledWith(
        'session/init',
        { alias: 'test@example.com' },
        {
          baseURL: 'https://api.synaps.io/v4',
          headers: { 'Api-Key': synapsConfigService.apiKey },
        },
      );
      expect(kycRepository.createUnique).toHaveBeenCalledWith({
        sessionId: '123',
        status: KycStatus.NONE,
        userId: 1,
      });
    });
  });

  describe('updateKycStatus', () => {
    const mockKycUpdate = {
      stepId: 'xx',
      service: 'ID DOCUMENT',
      sessionId: '123',
      state: KycStatus.APPROVED,
    };

    it('Should throw an error if the secret is invalid', async () => {
      await expect(
        kycService.updateKycStatus('invalid', mockKycUpdate),
      ).rejects.toThrow(
        new ControlledError(
          ErrorKyc.InvalidWebhookSecret,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('Should throw an error if the session data is invalid from synaps', async () => {
      jest.spyOn(kycRepository, 'updateOne').mockResolvedValue({} as any);

      httpService.get = jest.fn().mockImplementation(() => {
        return of({
          data: {},
        });
      });

      await expect(
        kycService.updateKycStatus(
          synapsConfigService.webhookSecret,
          mockKycUpdate,
        ),
      ).rejects.toThrow(
        new ControlledError(
          ErrorKyc.InvalidSynapsAPIResponse,
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('Should update the Kyc status of the user', async () => {
      jest.spyOn(kycRepository, 'updateOne').mockResolvedValue({} as any);

      httpService.get = jest.fn().mockImplementation(() => {
        return of({
          data: {
            session: {
              id: '123',
              status: KycStatus.APPROVED,
            },
          },
        });
      });

      await kycService.updateKycStatus(
        synapsConfigService.webhookSecret,
        mockKycUpdate,
      );

      expect(kycRepository.updateOne).toHaveBeenCalledWith({
        status: KycStatus.APPROVED,
      });
    });
  });
});
