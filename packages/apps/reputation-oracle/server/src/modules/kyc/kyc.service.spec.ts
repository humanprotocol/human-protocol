import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { ethers } from 'ethers';

import { KycConfigService } from '../../config/kyc-config.service';
import { Web3ConfigService } from '../../config/web3-config.service';

import {
  createHttpServiceMock,
  createHttpServiceResponse,
} from '../../../test/mock-creators/nest';

import { KycStatus } from '../kyc/constants';
import { UserEntity } from '../user';
import { generateWorkerUser } from '../user/fixtures';
import { mockWeb3ConfigService } from '../web3/fixtures';
import { Web3Service } from '../web3/web3.service';

import { UpdateKycStatusDto } from './kyc.dto';
import { KycEntity } from './kyc.entity';
import { KycError, KycErrorMessage } from './kyc.error';
import { KycRepository } from './kyc.repository';
import { KycService } from './kyc.service';
import { generateKycEntity, mockKycConfigService } from './fixtures';

const mockHttpService = createHttpServiceMock();

const mockKycRepository = createMock<KycRepository>();

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
        const mockUserEntity = generateWorkerUser();
        mockUserEntity.kyc = generateKycEntity(
          mockUserEntity.id,
          KycStatus.NONE,
        );

        const result = await kycService.initSession(
          mockUserEntity as UserEntity,
        );

        expect(result).toEqual({
          url: mockUserEntity.kyc.url,
        });
      });

      it('status is resubmission_requested', async () => {
        const mockUserEntity = generateWorkerUser();
        mockUserEntity.kyc = generateKycEntity(
          mockUserEntity.id,
          KycStatus.RESUBMISSION_REQUESTED,
        );

        const result = await kycService.initSession(
          mockUserEntity as UserEntity,
        );

        expect(result).toEqual({
          url: mockUserEntity.kyc.url,
        });
      });
    });

    it('Should throw an error if user already has an active Kyc session, but is approved already', async () => {
      const mockUserEntity = generateWorkerUser();
      mockUserEntity.kyc = generateKycEntity(
        mockUserEntity.id,
        KycStatus.APPROVED,
      );

      await expect(
        kycService.initSession(mockUserEntity as any),
      ).rejects.toThrow(
        new KycError(KycErrorMessage.ALREADY_APPROVED, mockUserEntity.id),
      );
    });

    it("Should throw an error if user already has an active Kyc session, but it's declined", async () => {
      const mockUserEntity = generateWorkerUser();
      mockUserEntity.kyc = generateKycEntity(
        mockUserEntity.id,
        KycStatus.DECLINED,
      );

      await expect(
        kycService.initSession(mockUserEntity as any),
      ).rejects.toThrow(
        new KycError(KycErrorMessage.DECLINED, mockUserEntity.id),
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

      mockKycRepository.createUnique.mockResolvedValueOnce({} as KycEntity);
      const result = await kycService.initSession(mockUserEntity);

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
      const mockUserEntity = generateWorkerUser({ withAddress: false });

      await expect(
        kycService.getSignedAddress(mockUserEntity as UserEntity),
      ).rejects.toThrow(
        new KycError(
          KycErrorMessage.NO_WALLET_ADDRESS_REGISTERED,
          mockUserEntity.id,
        ),
      );
    });

    it('Should throw an error if the user KYC status is not approved', async () => {
      const mockUserEntity = generateWorkerUser({ withAddress: true });
      mockUserEntity.kyc = generateKycEntity(mockUserEntity.id, KycStatus.NONE);

      await expect(
        kycService.getSignedAddress(mockUserEntity as UserEntity),
      ).rejects.toThrow(
        new KycError(KycErrorMessage.KYC_NOT_APPROVED, mockUserEntity.id),
      );
    });

    it('Should return the signed address', async () => {
      const mockUserEntity = generateWorkerUser({ withAddress: true });
      mockUserEntity.kyc = generateKycEntity(
        mockUserEntity.id,
        KycStatus.APPROVED,
      );

      const result = await kycService.getSignedAddress(
        mockUserEntity as UserEntity,
      );

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
