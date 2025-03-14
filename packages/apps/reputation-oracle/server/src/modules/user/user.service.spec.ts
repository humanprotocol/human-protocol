import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';

import { generateEthWallet } from '../../../test/fixtures/web3';

import { Web3ConfigService } from '../../config/web3-config.service';
import { HCaptchaService } from '../../integrations/hcaptcha/hcaptcha.service';
import * as securityUtils from '../../utils/security';

import { generateKycEntity } from '../kyc/fixtures';
import { mockWeb3ConfigService } from '../web3/fixtures';
import { Web3Service } from '../web3/web3.service';

import {
  generateSiteKeyEntity,
  generateOperator,
  generateWorkerUser,
} from './fixtures';
import { Role, UserStatus } from './user.entity';
import { UserError, UserErrorMessage } from './user.error';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { SiteKeyRepository } from './site-key.repository';
import { SiteKeyType } from './site-key.entity';
import { KycStatus } from '../kyc/constants';

const mockUserRepository = createMock<UserRepository>();
const mockSiteKeyRepository = createMock<SiteKeyRepository>();
const mockWeb3Service = createMock<Web3Service>();
const mockHCaptchaService = createMock<HCaptchaService>();

describe('UserService', () => {
  let userService: UserService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: SiteKeyRepository,
          useValue: mockSiteKeyRepository,
        },
        {
          provide: SiteKeyRepository,
          useValue: mockSiteKeyRepository,
        },
        {
          provide: Web3Service,
          useValue: mockWeb3Service,
        },
        {
          provide: HCaptchaService,
          useValue: mockHCaptchaService,
        },
        {
          provide: Web3ConfigService,
          useValue: mockWeb3ConfigService,
        },
      ],
    }).compile();

    userService = moduleRef.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('isWeb2UserRole', () => {
    it.each(
      Object.values(Role).map((role) => ({
        role,
        result: role === Role.OPERATOR ? false : true,
      })),
    )('should return "$result" for "$role" role', ({ role, result }) => {
      expect(UserService.isWeb2UserRole(role)).toBe(result);
    });
  });

  describe('createWorkerUser', () => {
    it('should create worker user and return the created entity', async () => {
      const createUserData = {
        email: faker.internet.email(),
        password: faker.internet.password(),
      };

      const expectedUserData = {
        email: createUserData.email,
        role: Role.WORKER,
        status: UserStatus.PENDING,
        password: expect.not.stringMatching(createUserData.password),
      };

      const result = await userService.createWorkerUser(createUserData);

      expect(mockUserRepository.createUnique).toHaveBeenCalledWith(
        expectedUserData,
      );
      expect(result).toEqual(expectedUserData);

      expect(
        securityUtils.comparePasswordWithHash(
          createUserData.password,
          result.password,
        ),
      ).toBe(true);
    });
  });

  describe('updatePassword', () => {
    it('should throw if user not found', async () => {
      mockUserRepository.findOneById.mockResolvedValueOnce(null);

      await expect(
        userService.updatePassword(
          faker.number.int(),
          faker.internet.password(),
        ),
      ).rejects.toThrow('User not found');
    });

    it('should throw if not web2 user', async () => {
      const mockUserEntity = generateOperator();
      mockUserRepository.findOneById.mockResolvedValueOnce(mockUserEntity);

      await expect(
        userService.updatePassword(
          faker.number.int(),
          faker.internet.password(),
        ),
      ).rejects.toThrow('Only web2 users can have password');
    });

    it('should update password for requested user', async () => {
      const mockUserEntity = generateWorkerUser();
      mockUserRepository.findOneById.mockResolvedValueOnce(mockUserEntity);

      const newPassword = faker.internet.password();

      const result = await userService.updatePassword(
        mockUserEntity.id,
        newPassword,
      );

      expect(
        securityUtils.comparePasswordWithHash(newPassword, result.password),
      ).toBe(true);

      expect(mockUserRepository.findOneById).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.findOneById).toHaveBeenCalledWith(
        mockUserEntity.id,
      );

      const expectedUserData = {
        ...mockUserEntity,
        password: expect.not.stringMatching(mockUserEntity.password),
      };

      expect(mockUserRepository.updateOne).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.updateOne).toHaveBeenCalledWith(
        expectedUserData,
      );

      expect(result).toEqual(expectedUserData);
    });
  });

  describe('createOperatorUser', () => {
    it('should create operator user and return the created entity', async () => {
      const newOperatorAddress = generateEthWallet().address;

      const expectedUserData = {
        evmAddress: newOperatorAddress.toLowerCase(),
        nonce: expect.any(String),
        role: Role.OPERATOR,
        status: UserStatus.ACTIVE,
      };

      const result = await userService.createOperatorUser(newOperatorAddress);

      expect(mockUserRepository.createUnique).toHaveBeenCalledWith(
        expectedUserData,
      );
      expect(result).toEqual(expectedUserData);
    });
  });

  describe('registerLabeler', () => {
    it('should throw if not worker user', async () => {
      const user = generateWorkerUser();
      user.role = Role.ADMIN;

      await expect(userService.registerLabeler(user)).rejects.toThrow(
        new UserError(UserErrorMessage.INVALID_ROLE, user.id),
      );
    });

    it('should throw if worker does not have evm address', async () => {
      const user = generateWorkerUser({ withAddress: false });

      await expect(userService.registerLabeler(user)).rejects.toThrow(
        new UserError(UserErrorMessage.MISSING_ADDRESS, user.id),
      );
    });

    it('should throw if kyc is not approved', async () => {
      const user = generateWorkerUser({ withAddress: true });
      user.kyc = generateKycEntity(user.id, KycStatus.NONE);

      await expect(userService.registerLabeler(user)).rejects.toThrow(
        new UserError(UserErrorMessage.KYC_NOT_APPROVED, user.id),
      );
    });

    it('should return existing sitekey if already registered', async () => {
      const user = generateWorkerUser({ withAddress: true });
      user.kyc = generateKycEntity(user.id, KycStatus.APPROVED);

      const existingSitekey = generateSiteKeyEntity(
        user.id,
        SiteKeyType.HCAPTCHA,
      );
      user.siteKeys = [existingSitekey];

      const result = await userService.registerLabeler(user);

      expect(result).toBe(existingSitekey.siteKey);
    });

    it('should register labeler if not already registered', async () => {
      const user = generateWorkerUser({ withAddress: true });
      user.kyc = generateKycEntity(user.id, KycStatus.APPROVED);
      user.siteKeys = [
        generateSiteKeyEntity(user.id, SiteKeyType.REGISTRATION),
      ];
      mockHCaptchaService.registerLabeler.mockResolvedValueOnce(true);

      const registeredSitekey = faker.string.uuid();
      const mockedLabelerData = {
        sitekeys: [{ sitekey: registeredSitekey }],
      };
      mockHCaptchaService.getLabelerData.mockResolvedValueOnce(
        mockedLabelerData,
      );

      const result = await userService.registerLabeler(user);

      expect(result).toBe(registeredSitekey);

      expect(mockHCaptchaService.registerLabeler).toHaveBeenCalledTimes(1);
      expect(mockHCaptchaService.registerLabeler).toHaveBeenCalledWith({
        email: user.email,
        evmAddress: user.evmAddress,
        country: user.kyc.country,
      });

      expect(mockHCaptchaService.getLabelerData).toHaveBeenCalledTimes(1);
      expect(mockHCaptchaService.getLabelerData).toHaveBeenCalledWith(
        user.email,
      );

      expect(mockSiteKeyRepository.createUnique).toHaveBeenCalledTimes(1);
      expect(mockSiteKeyRepository.createUnique).toHaveBeenCalledWith({
        userId: user.id,
        siteKey: registeredSitekey,
        type: SiteKeyType.HCAPTCHA,
      });
    });

    it('should throw LabelingEnableFailed if registering labeler fails', async () => {
      const user = generateWorkerUser({ withAddress: true });
      user.kyc = generateKycEntity(user.id, KycStatus.APPROVED);

      mockHCaptchaService.registerLabeler.mockResolvedValueOnce(false);

      await expect(userService.registerLabeler(user)).rejects.toThrow(
        new UserError(UserErrorMessage.LABELING_ENABLE_FAILED, user.id),
      );
    });

    it('should throw LabelingEnableFailed if retrieving labeler data fails', async () => {
      const user = generateWorkerUser({ withAddress: true });
      user.kyc = generateKycEntity(user.id, KycStatus.APPROVED);

      mockHCaptchaService.registerLabeler.mockResolvedValueOnce(true);

      mockHCaptchaService.getLabelerData.mockResolvedValueOnce(null);

      await expect(userService.registerLabeler(user)).rejects.toThrow(
        new UserError(UserErrorMessage.LABELING_ENABLE_FAILED, user.id),
      );
    });
  });
});
