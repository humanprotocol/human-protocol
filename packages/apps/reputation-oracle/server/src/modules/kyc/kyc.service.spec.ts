import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { ethers } from 'ethers';

import { generateEthWallet } from '~/test/fixtures/web3';
import {
  createHttpServiceMock,
  createHttpServiceResponse,
} from '~/test/mock-creators/nest';
import { KycConfigService, Web3ConfigService } from '@/config';
import { KycStatus } from './constants';
import { UserRepository } from '@/modules/user';
import { generateWorkerUser } from '@/modules/user/fixtures';
import { mockWeb3ConfigService } from '@/modules/web3/fixtures';
import { Web3Service } from '@/modules/web3';

import { UpdateKycStatusDto } from './kyc.dto';
import { KycEntity } from './kyc.entity';
import { KycError, KycErrorMessage } from './kyc.error';
import { KycRepository } from './kyc.repository';
import { KycService } from './kyc.service';
import { generateKycEntity, mockKycConfigService } from './fixtures';

const mockHttpService = createHttpServiceMock();

const mockKycRepository = createMock<KycRepository>();
const mockUserRepository = createMock<UserRepository>();

describe('Kyc Service', () => {
  let kycService: KycService;
  let httpService: HttpService;
  let kycConfigService: KycConfigService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        KycService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: KycConfigService, useValue: mockKycConfigService },
        { provide: KycRepository, useValue: mockKycRepository },
        { provide: UserRepository, useValue: mockUserRepository },
        {
          provide: Web3ConfigService,
          useValue: mockWeb3ConfigService,
        },
        Web3Service,
      ],
    }).compile();

    httpService = moduleRef.get<HttpService>(HttpService);
    kycService = moduleRef.get<KycService>(KycService);
    kycConfigService = moduleRef.get<KycConfigService>(KycConfigService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('initSession', () => {
    describe('Should return existing session url if user already has an active Kyc session, and is waiting for user to make an action', () => {
      it('status is none', async () => {
        const mockKycEntity = generateKycEntity(
          faker.number.int(),
          KycStatus.NONE,
        );
        mockKycRepository.findOneByUserId.mockResolvedValueOnce(mockKycEntity);

        const result = await kycService.initSession(mockKycEntity.userId);

        expect(result).toEqual({
          url: mockKycEntity.url,
        });
      });

      it('status is resubmission_requested', async () => {
        const mockKycEntity = generateKycEntity(
          faker.number.int(),
          KycStatus.RESUBMISSION_REQUESTED,
        );
        mockKycRepository.findOneByUserId.mockResolvedValueOnce(mockKycEntity);

        const result = await kycService.initSession(mockKycEntity.userId);

        expect(result).toEqual({
          url: mockKycEntity.url,
        });
      });
    });

    it('Should throw an error if user already has an active Kyc session, but is approved already', async () => {
      const mockKycEntity = generateKycEntity(
        faker.number.int(),
        KycStatus.APPROVED,
      );
      mockKycRepository.findOneByUserId.mockResolvedValueOnce(mockKycEntity);

      await expect(
        kycService.initSession(mockKycEntity.userId),
      ).rejects.toThrow(
        new KycError(KycErrorMessage.ALREADY_APPROVED, mockKycEntity.userId),
      );
    });

    it("Should throw an error if user already has an active Kyc session, but it's declined", async () => {
      const mockKycEntity = generateKycEntity(
        faker.number.int(),
        KycStatus.DECLINED,
      );
      mockKycRepository.findOneByUserId.mockResolvedValueOnce(mockKycEntity);

      await expect(
        kycService.initSession(mockKycEntity.userId),
      ).rejects.toThrow(
        new KycError(KycErrorMessage.DECLINED, mockKycEntity.userId),
      );
    });

    it('Should start a Kyc session for the user', async () => {
      const mockUserEntity = generateWorkerUser();

      const mockPostKycRespose = {
        status: 'success',
        verification: {
          id: mockUserEntity.id,
          url: faker.internet.url(),
        },
      };
      mockHttpService.post.mockReturnValueOnce(
        createHttpServiceResponse(200, mockPostKycRespose),
      );

      mockKycRepository.findOneByUserId.mockResolvedValueOnce(null);
      mockKycRepository.createUnique.mockResolvedValueOnce({} as KycEntity);

      const result = await kycService.initSession(mockUserEntity.id);

      expect(result).toEqual({
        url: mockPostKycRespose.verification.url,
      });
      expect(httpService.post).toHaveBeenCalledWith(
        `${kycConfigService.baseUrl}/sessions`,
        {
          verification: {
            vendorData: `${mockUserEntity.id}`,
          },
        },
        {
          headers: { 'X-AUTH-CLIENT': kycConfigService.apiKey },
        },
      );
    });
  });

  describe('updateKycStatus', () => {
    let mockKycUpdate: UpdateKycStatusDto;

    beforeEach(() => {
      mockKycUpdate = {
        status: 'success',
        verification: {
          id: faker.string.uuid(),
          vendorData: String(faker.number.int()),
          status: KycStatus.APPROVED,
          document: {
            country: faker.location.countryCode(),
          },
          reason: null,
        },
      };
    });

    it.each([KycStatus.NONE, KycStatus.RESUBMISSION_REQUESTED])(
      'Should update the Kyc status of the user [%#]',
      async (status) => {
        const mockKycEntity = generateKycEntity(faker.number.int(), status);

        mockKycRepository.findOneBySessionId.mockResolvedValueOnce(
          mockKycEntity,
        );

        await kycService.updateKycStatus(mockKycUpdate);

        expect(mockKycRepository.updateOne).toHaveBeenCalledWith({
          ...mockKycEntity,
          status: KycStatus.APPROVED,
          country: mockKycUpdate.verification.document.country,
          message: null,
        });
      },
    );

    it.each([
      KycStatus.ABANDONED,
      KycStatus.APPROVED,
      KycStatus.DECLINED,
      KycStatus.EXPIRED,
    ])(
      'Should ignore status update if kyc is already in final status [%#]',
      async (status) => {
        const mockKycEntity = generateKycEntity(faker.number.int(), status);

        mockKycRepository.findOneBySessionId.mockResolvedValueOnce(
          mockKycEntity,
        );

        await kycService.updateKycStatus(mockKycUpdate);

        expect(mockKycRepository.updateOne).not.toHaveBeenCalled();
      },
    );

    it('Should throw COUNTRY_NOT_SET error if new status is approved but there is no country', async () => {
      const mockKycEntity = generateKycEntity(
        faker.number.int(),
        KycStatus.NONE,
      );

      mockKycRepository.findOneBySessionId.mockResolvedValueOnce(mockKycEntity);

      mockKycUpdate.verification.document.country = null;
      expect(kycService.updateKycStatus(mockKycUpdate)).rejects.toThrow(
        new KycError(
          KycErrorMessage.COUNTRY_NOT_SET,
          mockKycEntity.userId as number,
        ),
      );
    });
  });

  describe('getSignedAddress', () => {
    it('Should throw an error if the user has no wallet address registered', async () => {
      const mockUserEntity = generateWorkerUser();
      mockUserRepository.findOneById.mockResolvedValueOnce(mockUserEntity);

      await expect(
        kycService.getSignedAddress(mockUserEntity.id),
      ).rejects.toThrow(
        new KycError(
          KycErrorMessage.NO_WALLET_ADDRESS_REGISTERED,
          mockUserEntity.id,
        ),
      );
    });

    it('Should throw an error if the user KYC status is not approved', async () => {
      const mockUserEntity = generateWorkerUser({
        privateKey: generateEthWallet().privateKey,
      });
      mockUserEntity.kyc = generateKycEntity(mockUserEntity.id, KycStatus.NONE);
      mockUserRepository.findOneById.mockResolvedValueOnce(mockUserEntity);

      await expect(
        kycService.getSignedAddress(mockUserEntity.id),
      ).rejects.toThrow(
        new KycError(KycErrorMessage.KYC_NOT_APPROVED, mockUserEntity.id),
      );
    });

    it('Should return the signed address', async () => {
      const mockUserEntity = generateWorkerUser({
        privateKey: generateEthWallet().privateKey,
      });
      mockUserEntity.kyc = generateKycEntity(
        mockUserEntity.id,
        KycStatus.APPROVED,
      );
      mockUserRepository.findOneById.mockResolvedValueOnce(mockUserEntity);

      const result = await kycService.getSignedAddress(mockUserEntity.id);

      const wallet = new ethers.Wallet(mockWeb3ConfigService.privateKey);
      const signedUserAddressWithOperatorPrivateKey = await wallet.signMessage(
        mockUserEntity.evmAddress,
      );

      expect(result).toEqual({
        key: `KYC-${mockWeb3ConfigService.operatorAddress}`,
        value: signedUserAddressWithOperatorPrivateKey,
      });
    });
  });
});
