import { createMock } from '@golevelup/ts-jest';
import { ChainId } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import { DeepPartial } from 'typeorm';
import { MOCK_ADDRESS } from '../../../test/constants';
import { HCaptchaConfigService } from '../../common/config/hcaptcha-config.service';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { SynapsConfigService } from '../../common/config/synaps-config.service';
import { ErrorKyc, ErrorUser } from '../../common/constants/errors';
import { KycServiceType, KycStatus } from '../../common/enums/user';
import { ControlledError } from '../../common/errors/controlled';
import { Web3Service } from '../web3/web3.service';
import { KycEntity } from './kyc.entity';
import { KycRepository } from './kyc.repository';
import { KycService } from './kyc.service';

describe('Kyc Service', () => {
  let kycService: KycService;
  let httpService: HttpService;
  let kycRepository: KycRepository;
  let synapsConfigService: SynapsConfigService;
  let web3Service: Web3Service;

  beforeAll(async () => {
    const mockHttpService: DeepPartial<HttpService> = {
      axiosRef: {
        request: jest.fn(),
      },
    };

    const signerMock = {
      address: MOCK_ADDRESS,
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
      signMessage: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        KycService,
        ConfigService,
        SynapsConfigService,
        HCaptchaConfigService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        { provide: KycRepository, useValue: createMock<KycRepository>() },
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
            getOperatorAddress: jest
              .fn()
              .mockReturnValue(MOCK_ADDRESS.toLowerCase()),
          },
        },
        ConfigService,
        {
          provide: NetworkConfigService,
          useValue: {
            networks: [{ chainId: ChainId.LOCALHOST }],
          },
        },
      ],
    }).compile();

    httpService = moduleRef.get<HttpService>(HttpService);
    kycService = moduleRef.get<KycService>(KycService);
    kycRepository = moduleRef.get<KycRepository>(KycRepository);
    synapsConfigService =
      moduleRef.get<SynapsConfigService>(SynapsConfigService);
    web3Service = moduleRef.get<Web3Service>(Web3Service);

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
    });
  });

  describe('updateKycStatus', () => {
    const mockKycUpdate = {
      stepId: 'xx',
      service: 'ID DOCUMENT',
      sessionId: '123',
      status: KycStatus.APPROVED,
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

      httpService.get = jest
        .fn()
        .mockImplementationOnce(() => {
          return of({
            data: {
              session: {
                id: '123',
                status: KycStatus.APPROVED,
              },
            },
          });
        })
        .mockImplementationOnce(() => {
          return of({
            data: {
              document: {
                country: 'FRA',
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

    it('Should update the Kyc status of the user', async () => {
      jest.spyOn(kycRepository, 'updateOne').mockResolvedValue({} as any);

      httpService.get = jest
        .fn()
        .mockImplementationOnce(() => {
          return of({
            data: {
              session: {
                id: '123',
                status: KycStatus.APPROVED,
                service: KycServiceType.ID_DOCUMENT,
              },
            },
          });
        })
        .mockImplementationOnce(() => {
          return of({
            data: {
              document: {
                country: 'FRA',
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

    it('Should throw save status error when country is not set', async () => {
      jest.spyOn(kycRepository, 'updateOne').mockResolvedValue({} as any);

      httpService.get = jest
        .fn()
        .mockImplementationOnce(() => {
          return of({
            data: {
              session: {
                id: '123',
                status: KycStatus.APPROVED,
                service: KycServiceType.ID_DOCUMENT,
              },
            },
          });
        })
        .mockImplementationOnce(() => {
          return of({
            data: {
              document: {
                country: '',
              },
            },
          });
        });

      await kycService.updateKycStatus(
        synapsConfigService.webhookSecret,
        mockKycUpdate,
      );

      expect(kycRepository.updateOne).toHaveBeenCalledWith({
        status: KycStatus.ERROR,
      });
    });
  });

  describe('getSignedAddress', () => {
    it('Should throw an error if the user has no wallet address registered', async () => {
      const mockUserEntity = {};

      await expect(
        kycService.getSignedAddress(mockUserEntity as any),
      ).rejects.toThrow(
        new ControlledError(
          ErrorUser.NoWalletAddresRegistered,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('Should throw an error if the user KYC status is not approved', async () => {
      const mockUserEntity = {
        evmAddress: MOCK_ADDRESS,
        kyc: {
          status: KycStatus.NONE,
        },
      };

      await expect(
        kycService.getSignedAddress(mockUserEntity as any),
      ).rejects.toThrow(
        new ControlledError(ErrorUser.KycNotApproved, HttpStatus.BAD_REQUEST),
      );
    });

    it('Should return the signed address', async () => {
      const mockUserEntity = {
        evmAddress: MOCK_ADDRESS,
        kyc: {
          status: KycStatus.APPROVED,
        },
      };

      const signerMock = {
        address: MOCK_ADDRESS,
        getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
        signMessage: jest.fn().mockResolvedValue('signature'),
      };

      web3Service.getSigner = jest.fn().mockReturnValue(signerMock);

      const result = await kycService.getSignedAddress(mockUserEntity as any);

      expect(result).toEqual({
        key: `KYC-${MOCK_ADDRESS.toLowerCase()}`,
        value: 'signature',
      });
    });
  });
});
