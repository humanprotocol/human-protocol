import { createMock } from '@golevelup/ts-jest';
import { ChainId } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { of } from 'rxjs';
import { DeepPartial } from 'typeorm';
import { MOCK_ADDRESS, mockConfig } from '../../../test/constants';
import { HCaptchaConfigService } from '../../config/hcaptcha-config.service';
import { NetworkConfigService } from '../../config/network-config.service';
import { KycConfigService } from '../../config/kyc-config.service';
import { KycStatus } from '../../common/enums/user';
import { Web3Service } from '../web3/web3.service';
import { KycEntity } from './kyc.entity';
import { KycRepository } from './kyc.repository';
import { KycService } from './kyc.service';
import { KycError, KycErrorMessage } from './kyc.error';

describe('Kyc Service', () => {
  let kycService: KycService;
  let httpService: HttpService;
  let kycRepository: KycRepository;
  let kycConfigService: KycConfigService;
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
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key]),
            getOrThrow: jest.fn((key: string) => {
              if (!mockConfig[key]) {
                throw new Error(`Configuration key "${key}" does not exist`);
              }
              return mockConfig[key];
            }),
          },
        },
        KycService,
        KycConfigService,
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
    kycConfigService = moduleRef.get<KycConfigService>(KycConfigService);
    web3Service = moduleRef.get<Web3Service>(Web3Service);

    jest
      .spyOn(KycConfigService.prototype, 'apiKey', 'get')
      .mockReturnValue('test');
  });

  describe('initSession', () => {
    describe('Should return existing session url if user already has an active Kyc session, and is waiting for user to make an action', () => {
      it('status is none', async () => {
        const mockUserEntity = {
          kyc: {
            sessionId: '123',
            url: 'https://randomurl.test',
            status: KycStatus.NONE,
          },
        };

        const result = await kycService.initSession(mockUserEntity as any);

        expect(result).toEqual({
          url: 'https://randomurl.test',
        });
      });

      it('status is resubmission_requested', async () => {
        const mockUserEntity = {
          kyc: {
            sessionId: '123',
            url: 'https://randomurl.test',
            status: KycStatus.RESUBMISSION_REQUESTED,
          },
        };

        const result = await kycService.initSession(mockUserEntity as any);

        expect(result).toEqual({
          url: 'https://randomurl.test',
        });
      });
    });

    it('Should throw an error if user already has an active Kyc session, but is approved already', async () => {
      const mockUserEntity = {
        id: 1,
        kyc: {
          sessionId: '123',
          url: 'https://randomurl.test',
          status: KycStatus.APPROVED,
        },
      };

      await expect(
        kycService.initSession(mockUserEntity as any),
      ).rejects.toThrow(
        new KycError(KycErrorMessage.ALREADY_APPROVED, mockUserEntity.id),
      );
    });

    it("Should throw an error if user already has an active Kyc session, but it's in review", async () => {
      const mockUserEntity = {
        id: 1,
        kyc: {
          sessionId: '123',
          url: 'https://randomurl.test',
          status: KycStatus.REVIEW,
        },
      };

      await expect(
        kycService.initSession(mockUserEntity as any),
      ).rejects.toThrow(
        new KycError(
          KycErrorMessage.VERIFICATION_IN_PROGRESS,
          mockUserEntity.id,
        ),
      );
    });

    it("Should throw an error if user already has an active Kyc session, but it's declined", async () => {
      const mockUserEntity = {
        id: 1,
        kyc: {
          sessionId: '123',
          url: 'https://randomurl.test',
          status: KycStatus.DECLINED,
          message: 'test',
        },
      };

      await expect(
        kycService.initSession(mockUserEntity as any),
      ).rejects.toThrow(
        new KycError(KycErrorMessage.DECLINED, mockUserEntity.id),
      );
    });

    it('Should start a Kyc session for the user', async () => {
      const mockUserEntity = {
        kyc: {
          sessionId: null,
          url: null,
        },
        id: 1,
        email: 'test@example.com',
      };

      httpService.post = jest.fn().mockImplementation(() => {
        return of({
          data: {
            status: 'success',
            verification: {
              id: 123,
              url: 'https://randomurl.test',
            },
          },
        });
      });

      jest
        .spyOn(kycRepository, 'createUnique')
        .mockResolvedValue({} as KycEntity);

      const result = await kycService.initSession(mockUserEntity as any);

      expect(result).toEqual({
        url: 'https://randomurl.test',
      });
      expect(httpService.post).toHaveBeenCalledWith(
        'sessions',
        {
          verification: {
            vendorData: '1',
          },
        },
        {
          baseURL: kycConfigService.baseUrl,
          headers: { 'X-AUTH-CLIENT': kycConfigService.apiKey },
        },
      );
    });
  });

  describe('updateKycStatus', () => {
    const mockKycUpdate = {
      status: 'success',
      verification: {
        id: '9df42a6f-b567-4bf9-a8f9-3e8585b533e5',
        vendorData: '3',
        status: 'approved',
        document: {
          country: 'GB',
        },
        reason: null,
      },
      technicalData: {
        ip: '0.0.0.0',
      },
    } as any;

    it('Should update the Kyc status of the user', async () => {
      const mockKycEntity: Partial<KycEntity> = {
        status: KycStatus.NONE,
      };
      jest
        .spyOn(kycRepository, 'findOneBySessionId')
        .mockResolvedValueOnce(mockKycEntity as any);
      jest
        .spyOn(kycRepository, 'updateOne')
        .mockResolvedValueOnce(mockKycUpdate);

      await kycService.updateKycStatus(mockKycUpdate);

      expect(kycRepository.updateOne).toHaveBeenCalledWith({
        status: KycStatus.APPROVED,
        country: 'GB',
        message: null,
      });
    });
  });

  describe('getSignedAddress', () => {
    it('Should throw an error if the user has no wallet address registered', async () => {
      const mockUserEntity = { id: 1 };

      await expect(
        kycService.getSignedAddress(mockUserEntity as any),
      ).rejects.toThrow(
        new KycError(
          KycErrorMessage.NO_WALLET_ADDRESS_REGISTERED,
          mockUserEntity.id,
        ),
      );
    });

    it('Should throw an error if the user KYC status is not approved', async () => {
      const mockUserEntity = {
        id: 1,
        evmAddress: MOCK_ADDRESS,
        kyc: {
          status: KycStatus.NONE,
        },
      };

      await expect(
        kycService.getSignedAddress(mockUserEntity as any),
      ).rejects.toThrow(
        new KycError(KycErrorMessage.KYC_NOT_APPROVED, mockUserEntity.id),
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
