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
});
