import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';

import { Web3ConfigService } from '../../config/web3-config.service';
import { HCaptchaService } from '../../integrations/hcaptcha/hcaptcha.service';
import * as securityUtils from '../../utils/security';

import { mockWeb3ConfigService } from '../web3/fixtures';
import { Web3Service } from '../web3/web3.service';

import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { SiteKeyRepository } from './site-key.repository';
import { Role, UserStatus } from './user.entity';
import { generateOperator, generateWorkerUser } from './fixtures';

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
});
