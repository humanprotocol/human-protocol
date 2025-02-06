import { createMock } from '@golevelup/ts-jest';
import {
  ChainId,
  KVStoreClient,
  KVStoreUtils,
  Role as SDKRole,
} from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { v4 } from 'uuid';
import {
  MOCK_ACCESS_TOKEN,
  MOCK_ADDRESS,
  MOCK_EMAIL,
  MOCK_FE_URL,
  MOCK_HASHED_PASSWORD,
  MOCK_HCAPTCHA_TOKEN,
  MOCK_PASSWORD,
  MOCK_PRIVATE_KEY,
  MOCK_REFRESH_TOKEN,
  mockConfig,
} from '../../../test/constants';
import { AuthConfigService } from '../../common/config/auth-config.service';
import { HCaptchaConfigService } from '../../common/config/hcaptcha-config.service';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { ServerConfigService } from '../../common/config/server-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { SENDGRID_TEMPLATES, SERVICE_NAME } from '../../common/constants';
import { JobRequestType } from '../../common/enums';
import { Role, UserStatus } from '../../common/enums/user';
import { SignatureType } from '../../common/enums/web3';
import {
  generateNonce,
  prepareSignatureBody,
  signMessage,
} from '../../common/utils/signature';
import { HCaptchaService } from '../../integrations/hcaptcha/hcaptcha.service';
import { SendGridService } from '../sendgrid/sendgrid.service';
import { SiteKeyRepository } from '../user/site-key.repository';
import { PrepareSignatureDto } from '../user/user.dto';
import { UserEntity } from '../user/user.entity';
import { UserRepository } from '../user/user.repository';
import { UserService } from '../user/user.service';
import { Web3Service } from '../web3/web3.service';
import {
  AuthError,
  AuthErrorMessage,
  DuplicatedUserEmailError,
  InvalidOperatorFeeError,
  InvalidOperatorJobTypesError,
  InvalidOperatorRoleError,
  InvalidOperatorUrlError,
} from './auth.error';
import { AuthService } from './auth.service';
import { TokenEntity, TokenType } from './token.entity';
import { TokenRepository } from './token.repository';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  KVStoreClient: {
    build: jest.fn().mockImplementation(() => ({
      set: jest.fn(),
    })),
  },
  KVStoreUtils: {
    get: jest.fn().mockResolvedValue(''),
  },
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mocked-uuid'),
}));

jest.spyOn(NetworkConfigService.prototype, 'networks', 'get').mockReturnValue([
  {
    chainId: ChainId.POLYGON_AMOY,
    rpcUrl: 'https://polygon-amoy.g.alchemy.com/v2/1234567890',
  },
]);

describe('AuthService', () => {
  let authService: AuthService;
  let tokenRepository: TokenRepository;
  let userService: UserService;
  let userRepository: UserRepository;
  let jwtService: JwtService;
  let sendGridService: SendGridService;
  let web3Service: Web3Service;
  let authConfigService: AuthConfigService;
  let hcaptchaService: HCaptchaService;

  beforeAll(async () => {
    const signerMock = {
      address: MOCK_ADDRESS,
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
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
        AuthService,
        UserService,
        AuthConfigService,
        ServerConfigService,
        Web3ConfigService,
        HCaptchaService,
        HCaptchaConfigService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        { provide: TokenRepository, useValue: createMock<TokenRepository>() },
        { provide: UserRepository, useValue: createMock<UserRepository>() },
        {
          provide: SiteKeyRepository,
          useValue: createMock<SiteKeyRepository>(),
        },
        { provide: HttpService, useValue: createMock<HttpService>() },
        { provide: SendGridService, useValue: createMock<SendGridService>() },
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
            getOperatorAddress: jest.fn().mockReturnValue(MOCK_ADDRESS),
          },
        },
        NetworkConfigService,
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    tokenRepository = moduleRef.get<TokenRepository>(TokenRepository);
    userService = moduleRef.get<UserService>(UserService);
    userRepository = moduleRef.get<UserRepository>(UserRepository);
    jwtService = moduleRef.get<JwtService>(JwtService);
    sendGridService = moduleRef.get<SendGridService>(SendGridService);
    web3Service = moduleRef.get<Web3Service>(Web3Service);
    authConfigService = moduleRef.get<AuthConfigService>(AuthConfigService);
    hcaptchaService = moduleRef.get<HCaptchaService>(HCaptchaService);

    hcaptchaService.verifyToken = jest.fn().mockReturnValue({ success: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('signin', () => {
    const signInDto = {
      email: MOCK_EMAIL,
      password: MOCK_PASSWORD,
      hCaptchaToken: MOCK_HCAPTCHA_TOKEN,
    };

    const userEntity: Partial<UserEntity> = {
      id: 1,
      email: signInDto.email,
      password: MOCK_HASHED_PASSWORD,
      status: UserStatus.ACTIVE,
    };

    let findOneByEmailMock: any;

    beforeEach(() => {
      findOneByEmailMock = jest.spyOn(userRepository, 'findOneByEmail');

      jest.spyOn(authService, 'auth').mockResolvedValue({
        accessToken: MOCK_ACCESS_TOKEN,
        refreshToken: MOCK_REFRESH_TOKEN,
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should sign in the user and return the JWT', async () => {
      findOneByEmailMock.mockResolvedValue(userEntity as UserEntity);

      const result = await authService.signin(signInDto);

      expect(findOneByEmailMock).toHaveBeenCalledWith(signInDto.email);
      expect(authService.auth).toHaveBeenCalledWith(userEntity);
      expect(result).toStrictEqual({
        accessToken: MOCK_ACCESS_TOKEN,
        refreshToken: MOCK_REFRESH_TOKEN,
      });
    });

    it('should throw if user credentials are invalid', async () => {
      findOneByEmailMock.mockResolvedValue(undefined);

      await expect(authService.signin(signInDto)).rejects.toThrow(
        new AuthError(AuthErrorMessage.INVALID_CREDENTIALS),
      );

      expect(findOneByEmailMock).toHaveBeenCalledWith(signInDto.email);
    });
  });

  describe('signup', () => {
    const userCreateDto = {
      email: MOCK_EMAIL,
      password: MOCK_PASSWORD,
      hCaptchaToken: 'token',
    };

    const userEntity: Partial<UserEntity> &
      Pick<UserEntity, 'id' | 'email' | 'password'> = {
      id: 1,
      email: userCreateDto.email,
      password: MOCK_HASHED_PASSWORD,
    };

    let createUserMock: any;

    beforeEach(() => {
      createUserMock = jest.spyOn(userService, 'create');

      createUserMock.mockResolvedValue(userEntity);

      jest.spyOn(userRepository, 'findOneByEmail').mockResolvedValue(null);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should create a new user and return the user entity', async () => {
      const result = await authService.signup(userCreateDto);

      expect(userService.create).toHaveBeenCalledWith(userCreateDto);
      expect(tokenRepository.createUnique).toHaveBeenCalledWith({
        type: TokenType.EMAIL,
        user: userEntity,
        expiresAt: expect.any(Date),
      });
      expect(result).toBe(userEntity);
    });

    it("should call sendGridService sendEmail if user's email is valid", async () => {
      sendGridService.sendEmail = jest.fn();

      await authService.signup(userCreateDto);

      expect(sendGridService.sendEmail).toHaveBeenCalled();
    });

    it('should fail if the user already exists', async () => {
      jest
        .spyOn(userRepository, 'findOneByEmail')
        .mockResolvedValue(userEntity as any);

      await expect(authService.signup(userCreateDto)).rejects.toThrow(
        new DuplicatedUserEmailError(userEntity.email),
      );

      expect(userRepository.findOneByEmail).toHaveBeenCalledWith(
        userEntity.email,
      );
    });
  });

  describe('auth', () => {
    let jwtSignMock: any, findTokenMock: any;

    const userEntity: Partial<UserEntity> = {
      id: 1,
      email: 'user@example.com',
      status: UserStatus.ACTIVE,
      evmAddress: MOCK_ADDRESS,
    };

    beforeEach(() => {
      jwtSignMock = jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce(MOCK_ACCESS_TOKEN);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should create authentication tokens and return them', async () => {
      findTokenMock = jest
        .spyOn(tokenRepository, 'findOneByUserIdAndType')
        .mockResolvedValueOnce(null);
      jest
        .spyOn(web3Service, 'getOperatorAddress')
        .mockReturnValueOnce(MOCK_ADDRESS);

      const result = await authService.auth(userEntity as UserEntity);
      expect(findTokenMock).toHaveBeenCalledWith(
        userEntity.id,
        TokenType.REFRESH,
      );
      expect(jwtSignMock).toHaveBeenLastCalledWith(
        {
          email: userEntity.email,
          status: userEntity.status,
          userId: userEntity.id,
          wallet_address: userEntity.evmAddress,
          kyc_status: userEntity.kyc?.status,
          reputation_network: MOCK_ADDRESS,
          qualifications: [],
          role: userEntity.role,
        },
        {
          expiresIn: authConfigService.accessTokenExpiresIn,
        },
      );
      expect(result).toEqual({
        accessToken: MOCK_ACCESS_TOKEN,
        refreshToken: undefined,
      });
    });

    describe('forgotPassword', () => {
      let findOneByEmailMock: any, findTokenMock: any;
      let userEntity: Partial<UserEntity>, tokenEntity: Partial<TokenEntity>;

      beforeEach(() => {
        userEntity = {
          id: 1,
          email: 'user@example.com',
          status: UserStatus.ACTIVE,
        };
        tokenEntity = {
          uuid: v4(),
          type: TokenType.EMAIL,
          user: userEntity as UserEntity,
        };

        findOneByEmailMock = jest.spyOn(userRepository, 'findOneByEmail');
        findTokenMock = jest.spyOn(tokenRepository, 'findOneByUserIdAndType');
        findOneByEmailMock.mockResolvedValue(userEntity);
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should exit early w/o action if user is not found', () => {
        findOneByEmailMock.mockResolvedValue(null);
        expect(
          authService.forgotPassword({
            email: 'user@example.com',
            hCaptchaToken: 'token',
          }),
        ).resolves.toBeUndefined();

        expect(sendGridService.sendEmail).not.toHaveBeenCalledWith();
      });

      it('should remove existing token if it exists', async () => {
        findTokenMock.mockResolvedValue(tokenEntity);
        await authService.forgotPassword({
          email: 'user@example.com',
          hCaptchaToken: 'token',
        });

        expect(tokenRepository.deleteOne).toHaveBeenCalled();
      });

      it('should create a new token and send email', async () => {
        sendGridService.sendEmail = jest.fn();
        const email = 'user@example.com';

        await authService.forgotPassword({ email, hCaptchaToken: 'token' });

        expect(sendGridService.sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            personalizations: [
              {
                dynamicTemplateData: {
                  service_name: SERVICE_NAME,
                  url: expect.stringContaining(
                    `${MOCK_FE_URL}/reset-password?token=`,
                  ),
                },
                to: email,
              },
            ],
            templateId: SENDGRID_TEMPLATES.resetPassword,
          }),
        );
      });

      it('should create a new token and send email if user is not active', async () => {
        sendGridService.sendEmail = jest.fn();
        userEntity.status = UserStatus.PENDING;
        const email = 'user@example.com';

        await authService.forgotPassword({ email, hCaptchaToken: 'token' });

        expect(sendGridService.sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            personalizations: [
              {
                dynamicTemplateData: {
                  service_name: SERVICE_NAME,
                  url: expect.stringContaining(
                    `${MOCK_FE_URL}/reset-password?token=`,
                  ),
                },
                to: email,
              },
            ],
            templateId: SENDGRID_TEMPLATES.resetPassword,
          }),
        );
      });
    });

    describe('restorePassword', () => {
      const userEntity: Partial<UserEntity> = {
        id: 1,
        email: 'user@example.com',
      };

      const tokenEntity: Partial<TokenEntity> = {
        uuid: v4(),
        type: TokenType.EMAIL,
        user: userEntity as UserEntity,
      };

      let findTokenMock: any;

      beforeEach(() => {
        findTokenMock = jest.spyOn(tokenRepository, 'findOneByUuidAndType');
        sendGridService.sendEmail = jest.fn();
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should throw an error if token is not found', () => {
        findTokenMock.mockResolvedValue(null);

        expect(
          authService.restorePassword({
            token: 'token',
            password: 'password',
            hCaptchaToken: 'token',
          }),
        ).rejects.toThrow(
          new AuthError(AuthErrorMessage.INVALID_REFRESH_TOKEN),
        );
      });

      it('should throw an error if token is expired', () => {
        tokenEntity.expiresAt = new Date(new Date().getDate() - 1);
        findTokenMock.mockResolvedValue(tokenEntity as TokenEntity);

        expect(
          authService.restorePassword({
            token: 'token',
            password: 'password',
            hCaptchaToken: 'token',
          }),
        ).rejects.toThrow(
          new AuthError(AuthErrorMessage.REFRESH_TOKEN_EXPIRED),
        );
      });

      it('should update password and send email', async () => {
        tokenEntity.expiresAt = new Date(
          new Date().setDate(new Date().getDate() + 1),
        );
        findTokenMock.mockResolvedValue(tokenEntity as TokenEntity);
        userService.updatePassword = jest.fn();
        sendGridService.sendEmail = jest.fn();

        const updatePasswordMock = jest.spyOn(userService, 'updatePassword');

        await authService.restorePassword({
          token: 'token',
          password: 'password',
          hCaptchaToken: 'token',
        });

        expect(updatePasswordMock).toHaveBeenCalled();
        expect(sendGridService.sendEmail).toHaveBeenCalled();
        expect(tokenRepository.deleteOne).toHaveBeenCalled();
      });
    });

    describe('emailVerification', () => {
      const userEntity: Partial<UserEntity> = {
        id: 1,
        email: 'user@example.com',
      };

      const tokenEntity: Partial<TokenEntity> = {
        uuid: v4(),
        type: TokenType.EMAIL,
        user: userEntity as UserEntity,
      };

      let findTokenMock: any;

      beforeEach(() => {
        findTokenMock = jest.spyOn(tokenRepository, 'findOneByUuidAndType');
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should throw an error if token is not found', () => {
        findTokenMock.mockResolvedValue(null);
        expect(
          authService.emailVerification({ token: 'token' }),
        ).rejects.toThrow(
          new AuthError(AuthErrorMessage.INVALID_REFRESH_TOKEN),
        );
      });
      it('should throw an error if token is expired', () => {
        tokenEntity.expiresAt = new Date(new Date().getDate() - 1);
        findTokenMock.mockResolvedValue(tokenEntity as TokenEntity);
        expect(
          authService.emailVerification({ token: 'token' }),
        ).rejects.toThrow(
          new AuthError(AuthErrorMessage.REFRESH_TOKEN_EXPIRED),
        );
      });

      it('should activate user', async () => {
        tokenEntity.expiresAt = new Date(
          new Date().setDate(new Date().getDate() + 1),
        );
        findTokenMock.mockResolvedValue(tokenEntity as TokenEntity);
        userRepository.updateOne = jest.fn();

        await authService.emailVerification({ token: 'token' });

        expect(userRepository.updateOne).toHaveBeenCalled();
        expect(tokenEntity.user?.status).toBe(UserStatus.ACTIVE);
      });
    });

    describe('resendEmailVerification', () => {
      let findOneByEmailMock: any,
        findTokenMock: any,
        createTokenMock: any,
        userEntity: Partial<UserEntity>;

      beforeEach(() => {
        userEntity = {
          id: 1,
          email: 'user@example.com',
          status: UserStatus.PENDING,
        };
        findOneByEmailMock = jest.spyOn(userRepository, 'findOneByEmail');
        findTokenMock = jest.spyOn(tokenRepository, 'findOneByUserIdAndType');
        createTokenMock = jest.spyOn(tokenRepository, 'createUnique');
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should exit early w/o action if user is not found', () => {
        findOneByEmailMock.mockResolvedValue(null);
        expect(
          authService.resendEmailVerification({
            email: 'user@example.com',
            hCaptchaToken: 'token',
          }),
        ).resolves.toBeUndefined();

        expect(sendGridService.sendEmail).not.toHaveBeenCalledWith();
      });

      it('should exit early w/o action if user is not pending', () => {
        userEntity.status = UserStatus.ACTIVE;
        findOneByEmailMock.mockResolvedValue(userEntity);
        expect(
          authService.resendEmailVerification({
            email: 'user@example.com',
            hCaptchaToken: 'token',
          }),
        ).resolves.toBeUndefined();

        expect(sendGridService.sendEmail).not.toHaveBeenCalledWith();
      });

      it('should create token and send email', async () => {
        findOneByEmailMock.mockResolvedValue(userEntity);
        findTokenMock.mockResolvedValueOnce(null);
        sendGridService.sendEmail = jest.fn();
        const email = 'user@example.com';

        await authService.resendEmailVerification({
          email,
          hCaptchaToken: 'token',
        });

        expect(createTokenMock).toHaveBeenCalled();
        expect(sendGridService.sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            personalizations: [
              {
                dynamicTemplateData: {
                  service_name: SERVICE_NAME,
                  url: expect.stringContaining('/verify?token='),
                },
                to: email,
              },
            ],
            templateId: SENDGRID_TEMPLATES.signup,
          }),
        );
      });
    });

    describe('web3auth', () => {
      describe('signin', () => {
        const nonce = generateNonce();
        const nonce1 = generateNonce();

        const userEntity: Partial<UserEntity> = {
          id: 1,
          evmAddress: MOCK_ADDRESS,
          nonce,
        };

        let getByAddressMock: any;
        let updateNonceMock: any;

        beforeEach(() => {
          getByAddressMock = jest.spyOn(userRepository, 'findOneByAddress');
          updateNonceMock = jest.spyOn(userService, 'updateNonce');

          jest.spyOn(authService, 'auth').mockResolvedValue({
            accessToken: MOCK_ACCESS_TOKEN,
            refreshToken: MOCK_REFRESH_TOKEN,
          });
          jest
            .spyOn(userRepository, 'findOneByAddress')
            .mockResolvedValue({ nonce: nonce } as any);
        });

        afterEach(() => {
          jest.clearAllMocks();
        });

        it('should sign in the user, reset nonce and return the JWT', async () => {
          getByAddressMock.mockResolvedValue(userEntity as UserEntity);
          updateNonceMock.mockResolvedValue({
            ...userEntity,
            nonce: nonce1,
          } as UserEntity);

          const data = {
            from: MOCK_ADDRESS.toLowerCase(),
            to: web3Service.getOperatorAddress().toLowerCase(),
            contents: 'signin',
            nonce: nonce,
          };

          const signature = await signMessage(data, MOCK_PRIVATE_KEY);
          const result = await authService.web3Signin({
            address: MOCK_ADDRESS,
            signature,
          });

          expect(userRepository.findOneByAddress).toHaveBeenCalledWith(
            MOCK_ADDRESS,
          );
          expect(userService.updateNonce).toHaveBeenCalledWith(userEntity);

          expect(authService.auth).toHaveBeenCalledWith(userEntity);
          expect(result).toStrictEqual({
            accessToken: MOCK_ACCESS_TOKEN,
            refreshToken: MOCK_REFRESH_TOKEN,
          });
        });

        it("should throw ConflictException if signature doesn't match", async () => {
          const invalidSignature = await signMessage(
            'invalid message',
            MOCK_PRIVATE_KEY,
          );

          await expect(
            authService.web3Signin({
              address: MOCK_ADDRESS,
              signature: invalidSignature,
            }),
          ).rejects.toThrow(
            new AuthError(AuthErrorMessage.INVALID_WEB3_SIGNATURE),
          );
        });
      });

      describe('signup', () => {
        const web3PreSignUpDto: PrepareSignatureDto = {
          address: MOCK_ADDRESS,
          type: SignatureType.SIGNUP,
        };

        const nonce = generateNonce();

        const userEntity: Partial<UserEntity> = {
          id: 1,
          evmAddress: web3PreSignUpDto.address,
          nonce,
        };

        const preSignUpData = prepareSignatureBody({
          from: web3PreSignUpDto.address,
          to: MOCK_ADDRESS,
          contents: SignatureType.SIGNUP,
        });

        let createUserMock: any;

        beforeEach(() => {
          createUserMock = jest.spyOn(userService, 'createWeb3User');

          createUserMock.mockResolvedValue(userEntity);

          jest.spyOn(authService, 'auth').mockResolvedValue({
            accessToken: MOCK_ACCESS_TOKEN,
            refreshToken: MOCK_REFRESH_TOKEN,
          });
          jest
            .spyOn(userRepository, 'findOneByAddress')
            .mockResolvedValue(null);
        });

        afterEach(() => {
          jest.clearAllMocks();
        });

        it('should create a new web3 user and return the token', async () => {
          (KVStoreClient.build as any).mockImplementationOnce(() => ({
            set: jest.fn(),
          }));
          KVStoreUtils.get = jest
            .fn()
            .mockResolvedValueOnce(SDKRole.JobLauncher)
            .mockResolvedValueOnce('url')
            .mockResolvedValueOnce(1)
            .mockResolvedValueOnce(JobRequestType.FORTUNE);

          const signature = await signMessage(preSignUpData, MOCK_PRIVATE_KEY);

          const result = await authService.web3Signup({
            address: web3PreSignUpDto.address,
            type: Role.WORKER,
            signature,
          });

          expect(userService.createWeb3User).toHaveBeenCalledWith(
            web3PreSignUpDto.address,
          );

          expect(authService.auth).toHaveBeenCalledWith(userEntity);
          expect(result).toStrictEqual({
            accessToken: MOCK_ACCESS_TOKEN,
            refreshToken: MOCK_REFRESH_TOKEN,
          });
        });

        it("should throw if signature doesn't match", async () => {
          const invalidSignature = await signMessage(
            'invalid message',
            MOCK_PRIVATE_KEY,
          );

          await expect(
            authService.web3Signup({
              ...web3PreSignUpDto,
              type: Role.WORKER,
              signature: invalidSignature,
            }),
          ).rejects.toThrow(
            new AuthError(AuthErrorMessage.INVALID_WEB3_SIGNATURE),
          );
        });
        it('should throw if role is not in KVStore', async () => {
          KVStoreUtils.get = jest.fn().mockResolvedValueOnce('');

          const signature = await signMessage(preSignUpData, MOCK_PRIVATE_KEY);

          await expect(
            authService.web3Signup({
              ...web3PreSignUpDto,
              type: Role.WORKER,
              signature: signature,
            }),
          ).rejects.toThrow(new InvalidOperatorRoleError(''));
        });
        it('should throw if fee is not in KVStore', async () => {
          KVStoreUtils.get = jest
            .fn()
            .mockResolvedValueOnce(SDKRole.JobLauncher);

          const signature = await signMessage(preSignUpData, MOCK_PRIVATE_KEY);

          await expect(
            authService.web3Signup({
              ...web3PreSignUpDto,
              type: Role.WORKER,
              signature: signature,
            }),
          ).rejects.toThrow(new InvalidOperatorFeeError(''));
        });
        it('should throw if url is not in KVStore', async () => {
          KVStoreUtils.get = jest
            .fn()
            .mockResolvedValueOnce(SDKRole.JobLauncher)
            .mockResolvedValueOnce('url');

          const signature = await signMessage(preSignUpData, MOCK_PRIVATE_KEY);

          await expect(
            authService.web3Signup({
              ...web3PreSignUpDto,
              type: Role.WORKER,
              signature: signature,
            }),
          ).rejects.toThrow(new InvalidOperatorUrlError(''));
        });
        it('should throw if job type is not in KVStore', async () => {
          KVStoreUtils.get = jest
            .fn()
            .mockResolvedValueOnce(SDKRole.JobLauncher)
            .mockResolvedValueOnce('url')
            .mockResolvedValueOnce(1);

          const signature = await signMessage(preSignUpData, MOCK_PRIVATE_KEY);

          await expect(
            authService.web3Signup({
              ...web3PreSignUpDto,
              type: Role.WORKER,
              signature: signature,
            }),
          ).rejects.toThrow(new InvalidOperatorJobTypesError(''));
        });
      });
    });
  });
});
