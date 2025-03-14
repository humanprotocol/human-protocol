import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';

import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { SiteKeyRepository } from './site-key.repository';
import { Web3Service } from '../web3/web3.service';
import { mockWeb3ConfigService } from '../web3/fixtures';
import { HCaptchaService } from '../../integrations/hcaptcha/hcaptcha.service';
import { Web3ConfigService } from '../../config/web3-config.service';

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

  it('created', () => {
    expect(userService).toBeDefined();
  });
});
