import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { TokenRepository } from './token.repository';
import { HttpService } from '@nestjs/axios';
import { createMock } from '@golevelup/ts-jest';
import { UserRepository } from '../user/user.repository';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { UserEntity } from '../user/user.entity';
import {
  ErrorAuth,
  ErrorSignature,
  ErrorUser,
} from '../../common/constants/errors';
import {
  MOCK_ACCESS_TOKEN,
  MOCK_ADDRESS,
  MOCK_EMAIL,
  MOCK_HASHED_PASSWORD,
  MOCK_HCAPTCHA_TOKEN,
  MOCK_PASSWORD,
  MOCK_PRIVATE_KEY,
  MOCK_REFRESH_TOKEN,
} from '../../../test/constants';
import { TokenEntity, TokenType } from './token.entity';
import { v4 } from 'uuid';
import { UserStatus, UserType } from '../../common/enums/user';
import { SendGridService } from '../sendgrid/sendgrid.service';
import { HttpStatus } from '@nestjs/common';
import { SENDGRID_TEMPLATES, SERVICE_NAME } from '../../common/constants';
import { generateNonce, signMessage } from '../../common/utils/signature';
import { Web3Service } from '../web3/web3.service';
import { KVStoreClient, Role } from '@human-protocol/sdk';
import { PrepareSignatureDto, SignatureBodyDto } from '../user/user.dto';
import { SignatureType } from '../../common/enums/web3';
import { AuthConfigService } from '../../common/config/auth-config.service';
import { ServerConfigService } from '../../common/config/server-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ConfigService } from '@nestjs/config';
import { ControlledError } from '../../common/errors/controlled';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  KVStoreClient: {
    build: jest.fn().mockImplementation(() => ({
      set: jest.fn(),
      get: jest.fn(),
    })),
  },
}));
jest.mock('../../common/utils/hcaptcha', () => ({
  verifyToken: jest.fn().mockReturnValue({ success: true }),
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mocked-uuid'),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let tokenRepository: TokenRepository;
  let userService: UserService;
  let userRepository: UserRepository;
  let jwtService: JwtService;
  let sendGridService: SendGridService;
  let web3Service: Web3Service;
  let authConfigService: AuthConfigService;

  beforeAll(async () => {
    const signerMock = {
      address: MOCK_ADDRESS,
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        UserService,
        AuthConfigService,
        ServerConfigService,
        Web3ConfigService,
        ConfigService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        { provide: TokenRepository, useValue: createMock<TokenRepository>() },
        { provide: UserRepository, useValue: createMock<UserRepository>() },
        { provide: HttpService, useValue: createMock<HttpService>() },
        { provide: SendGridService, useValue: createMock<SendGridService>() },
        {
          provide: Web3Service,
          useValue: {
            prepareSignatureBody: jest.fn(),
            getSigner: jest.fn().mockReturnValue(signerMock),
            signMessage: jest.fn(),
            getOperatorAddress: jest.fn().mockReturnValue(MOCK_ADDRESS),
          },
        },
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

    let getByCredentialsMock: any;

    beforeEach(() => {
      getByCredentialsMock = jest.spyOn(userService, 'getByCredentials');
      jest.spyOn(authService, 'auth').mockResolvedValue({
        accessToken: MOCK_ACCESS_TOKEN,
        refreshToken: MOCK_REFRESH_TOKEN,
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should sign in the user and return the JWT', async () => {
      getByCredentialsMock.mockResolvedValue(userEntity as UserEntity);

      const result = await authService.signin(signInDto);

      expect(userService.getByCredentials).toHaveBeenCalledWith(
        signInDto.email,
        signInDto.password,
      );
      expect(authService.auth).toHaveBeenCalledWith(userEntity);
      expect(result).toStrictEqual({
        accessToken: MOCK_ACCESS_TOKEN,
        refreshToken: MOCK_REFRESH_TOKEN,
      });
    });

    it('should throw UnauthorizedException if user credentials are invalid', async () => {
      getByCredentialsMock.mockResolvedValue(undefined);

      await expect(authService.signin(signInDto)).rejects.toThrow(
        ErrorAuth.InvalidEmailOrPassword,
      );

      expect(userService.getByCredentials).toHaveBeenCalledWith(
        signInDto.email,
        signInDto.password,
      );
    });
  });

  describe('signup', () => {
    const userCreateDto = {
      email: MOCK_EMAIL,
      password: MOCK_PASSWORD,
      hCaptchaToken: 'token',
    };

    const userEntity: Partial<UserEntity> = {
      id: 1,
      email: userCreateDto.email,
      password: MOCK_HASHED_PASSWORD,
    };

    let createUserMock: any;

    beforeEach(() => {
      createUserMock = jest.spyOn(userService, 'create');

      createUserMock.mockResolvedValue(userEntity);
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
  });

  describe('auth', () => {
    let jwtSignMock: any, findTokenMock: any;

    const userEntity: Partial<UserEntity> = {
      id: 1,
      email: 'user@example.com',
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
          userId: userEntity.id,
          address: userEntity.evmAddress,
          kyc_status: userEntity.kyc?.status,
          reputation_network: MOCK_ADDRESS,
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
      let findByEmailMock: any, findTokenMock: any;
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

        findByEmailMock = jest.spyOn(userRepository, 'findByEmail');
        findTokenMock = jest.spyOn(tokenRepository, 'findOneByUserIdAndType');
        findByEmailMock.mockResolvedValue(userEntity);
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should throw NotFound exception if user is not found', () => {
        findByEmailMock.mockResolvedValue(null);
        expect(
          authService.forgotPassword({ email: 'user@example.com' }),
        ).rejects.toThrow(
          new ControlledError(ErrorUser.NotFound, HttpStatus.NO_CONTENT),
        );
      });

      it('should throw Unauthorized exception if user is not active', () => {
        userEntity.status = UserStatus.INACTIVE;
        findByEmailMock.mockResolvedValue(userEntity);
        expect(
          authService.forgotPassword({ email: 'user@example.com' }),
        ).rejects.toThrow(
          new ControlledError(ErrorUser.UserNotActive, HttpStatus.FORBIDDEN),
        );
      });

      it('should remove existing token if it exists', async () => {
        findTokenMock.mockResolvedValue(tokenEntity);
        await authService.forgotPassword({ email: 'user@example.com' });

        expect(tokenRepository.deleteOne).toHaveBeenCalled();
      });

      it('should create a new token and send email', async () => {
        sendGridService.sendEmail = jest.fn();
        const email = 'user@example.com';

        await authService.forgotPassword({ email });

        expect(sendGridService.sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            personalizations: [
              {
                dynamicTemplateData: {
                  service_name: SERVICE_NAME,
                  url: expect.stringContaining(
                    'http://localhost:3001/reset-password?token=',
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
          new ControlledError(ErrorAuth.InvalidToken, HttpStatus.FORBIDDEN),
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
          new ControlledError(ErrorAuth.TokenExpired, HttpStatus.FORBIDDEN),
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
          new ControlledError(ErrorAuth.NotFound, HttpStatus.FORBIDDEN),
        );
      });
      it('should throw an error if token is expired', () => {
        tokenEntity.expiresAt = new Date(new Date().getDate() - 1);
        findTokenMock.mockResolvedValue(tokenEntity as TokenEntity);
        expect(
          authService.emailVerification({ token: 'token' }),
        ).rejects.toThrow(
          new ControlledError(ErrorAuth.TokenExpired, HttpStatus.FORBIDDEN),
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
      let findByEmailMock: any,
        findTokenMock: any,
        createTokenMock: any,
        userEntity: Partial<UserEntity>;

      beforeEach(() => {
        userEntity = {
          id: 1,
          email: 'user@example.com',
          status: UserStatus.PENDING,
        };
        findByEmailMock = jest.spyOn(userRepository, 'findByEmail');
        findTokenMock = jest.spyOn(tokenRepository, 'findOneByUserIdAndType');
        createTokenMock = jest.spyOn(tokenRepository, 'createUnique');
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should throw an error if user is not found', () => {
        findByEmailMock.mockResolvedValue(null);
        expect(
          authService.resendEmailVerification({ email: 'user@example.com' }),
        ).rejects.toThrow(
          new ControlledError(ErrorUser.NotFound, HttpStatus.NO_CONTENT),
        );
      });

      it('should throw an error if user is not pending', () => {
        userEntity.status = UserStatus.ACTIVE;
        findByEmailMock.mockResolvedValue(userEntity);
        expect(
          authService.resendEmailVerification({ email: 'user@example.com' }),
        ).rejects.toThrow(
          new ControlledError(ErrorUser.NotFound, HttpStatus.NO_CONTENT),
        );
      });

      it('should create token and send email', async () => {
        findByEmailMock.mockResolvedValue(userEntity);
        findTokenMock.mockResolvedValueOnce(null);
        sendGridService.sendEmail = jest.fn();
        const email = 'user@example.com';

        await authService.resendEmailVerification({ email });

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
          getByAddressMock = jest.spyOn(userService, 'getByAddress');
          updateNonceMock = jest.spyOn(userService, 'updateNonce');

          jest.spyOn(authService, 'auth').mockResolvedValue({
            accessToken: MOCK_ACCESS_TOKEN,
            refreshToken: MOCK_REFRESH_TOKEN,
          });
          jest
            .spyOn(userRepository, 'findOneByEvmAddress')
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
            from: MOCK_ADDRESS,
            to: web3Service.getOperatorAddress(),
            contents: 'signin',
            nonce: nonce,
          };

          const signature = await signMessage(data, MOCK_PRIVATE_KEY);
          const result = await authService.web3Signin({
            address: MOCK_ADDRESS,
            signature,
          });

          expect(userService.getByAddress).toHaveBeenCalledWith(MOCK_ADDRESS);
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
            new ControlledError(
              ErrorSignature.SignatureNotVerified,
              HttpStatus.CONFLICT,
            ),
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

        const preSignUpDataMock: SignatureBodyDto = {
          from: MOCK_ADDRESS,
          to: MOCK_ADDRESS,
          contents: 'signup',
          nonce: undefined,
        };
        let createUserMock: any;

        beforeEach(() => {
          createUserMock = jest.spyOn(userService, 'createWeb3User');

          createUserMock.mockResolvedValue(userEntity);

          jest.spyOn(authService, 'auth').mockResolvedValue({
            accessToken: MOCK_ACCESS_TOKEN,
            refreshToken: MOCK_REFRESH_TOKEN,
          });

          jest
            .spyOn(web3Service as any, 'prepareSignatureBody')
            .mockReturnValue(preSignUpDataMock);
        });

        afterEach(() => {
          jest.clearAllMocks();
        });

        it('should prepare the signature body and return it', async () => {
          const signatureType = SignatureType.SIGNUP;
          const address = '0xCf88b3f1992458C2f5a229573c768D0E9F70C44e';

          const expectedResult = {
            from: address,
            to: '0xCf88b3f1992458C2f5a229573c768D0E9F70C44e',
            contents: 'signup',
            nonce: undefined,
          };

          jest
            .spyOn(userService, 'prepareSignatureBody')
            .mockResolvedValue(expectedResult);

          const result = await userService.prepareSignatureBody(
            signatureType,
            address,
          );

          expect(result).toEqual(expectedResult);
        });

        it('should create a new web3 user and return the token', async () => {
          (KVStoreClient.build as any).mockImplementationOnce(() => ({
            get: jest.fn().mockResolvedValue(Role.JobLauncher),
            set: jest.fn(),
          }));

          const signature = await signMessage(
            preSignUpDataMock,
            MOCK_PRIVATE_KEY,
          );

          const result = await authService.web3Signup({
            address: web3PreSignUpDto.address,
            type: UserType.WORKER,
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

        it("should throw ConflictException if signature doesn't match", async () => {
          const invalidSignature = await signMessage(
            'invalid message',
            MOCK_PRIVATE_KEY,
          );

          await expect(
            authService.web3Signup({
              ...web3PreSignUpDto,
              type: UserType.WORKER,
              signature: invalidSignature,
            }),
          ).rejects.toThrow(
            new ControlledError(
              ErrorSignature.SignatureNotVerified,
              HttpStatus.CONFLICT,
            ),
          );
        });
        it('should throw BadRequestException if role is not in KVStore', async () => {
          const signature = await signMessage(
            preSignUpDataMock,
            MOCK_PRIVATE_KEY,
          );

          await expect(
            authService.web3Signup({
              ...web3PreSignUpDto,
              type: UserType.WORKER,
              signature: signature,
            }),
          ).rejects.toThrow(
            new ControlledError(ErrorAuth.InvalidRole, HttpStatus.BAD_REQUEST),
          );
        });
      });
    });
  });
});
