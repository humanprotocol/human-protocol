import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { TokenRepository } from './token.repository';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { createMock } from '@golevelup/ts-jest';
import { UserRepository } from '../user/user.repository';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { AuthEntity } from './auth.entity';
import { UserService } from '../user/user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { AuthRepository } from './auth.repository';
import { ErrorAuth } from '../../common/constants/errors';
import {
  MOCK_ACCESS_TOKEN,
  MOCK_ACCESS_TOKEN_HASHED,
  MOCK_ADDRESS,
  MOCK_EMAIL,
  MOCK_EXPIRES_IN,
  MOCK_HASHED_PASSWORD,
  MOCK_PASSWORD,
  MOCK_PRIVATE_KEY,
  MOCK_REFRESH_TOKEN,
  MOCK_REFRESH_TOKEN_HASHED,
} from '../../../test/constants';
import { TokenType } from './token.entity';
import { v4 } from 'uuid';
import { UserStatus, UserType } from '../../common/enums/user';
import { SendGridService } from '../sendgrid/sendgrid.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SENDGRID_TEMPLATES, SERVICE_NAME } from '../../common/constants';
import { getNonce, signMessage } from '../../common/utils/signature';
import { Web3Service } from '../web3/web3.service';
import { KVStoreClient, Role } from '@human-protocol/sdk';
import { PrepareSignatureDto, SignatureBodyDto } from '../web3/web3.dto';
import { SignatureType } from '../../common/enums/web3';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  KVStoreClient: {
    build: jest.fn().mockImplementation(() => ({
      set: jest.fn(),
      get: jest.fn(),
    })),
  },
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mocked-uuid'),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let tokenRepository: TokenRepository;
  let userService: UserService;
  let authRepository: AuthRepository;
  let jwtService: JwtService;
  let sendGridService: SendGridService;
  let web3Service: Web3Service;

  beforeAll(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'JWT_ACCESS_TOKEN_EXPIRES_IN':
            return MOCK_EXPIRES_IN;
        }
      }),
    };

    const signerMock = {
      address: MOCK_ADDRESS,
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        UserService,
        {
          provide: getRepositoryToken(AuthEntity),
          useClass: Repository,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        { provide: AuthRepository, useValue: createMock<AuthRepository>() },
        { provide: TokenRepository, useValue: createMock<TokenRepository>() },
        { provide: UserRepository, useValue: createMock<UserRepository>() },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: createMock<HttpService>() },
        { provide: SendGridService, useValue: createMock<SendGridService>() },
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
            signMessage: jest.fn(),
            getOperatorAddress: jest.fn().mockReturnValue(MOCK_ADDRESS),
            prepareSignatureBody: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    authRepository = moduleRef.get(AuthRepository);
    tokenRepository = moduleRef.get(TokenRepository);
    userService = moduleRef.get<UserService>(UserService);
    jwtService = moduleRef.get<JwtService>(JwtService);
    sendGridService = moduleRef.get<SendGridService>(SendGridService);
    web3Service = moduleRef.get<Web3Service>(Web3Service);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('signin', () => {
    const signInDto = {
      email: MOCK_EMAIL,
      password: MOCK_PASSWORD,
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
      type: UserType.WORKER,
    };

    const userEntity: Partial<UserEntity> = {
      id: 1,
      email: userCreateDto.email,
      password: MOCK_HASHED_PASSWORD,
    };

    const tokenEntity = {
      uuid: v4(),
      tokenType: TokenType.EMAIL,
      user: userEntity,
    };

    let createUserMock: any, createTokenMock: any;

    beforeEach(() => {
      createUserMock = jest.spyOn(userService, 'create');
      createTokenMock = jest.spyOn(tokenRepository, 'create');

      createUserMock.mockResolvedValue(userEntity);
      createTokenMock.mockResolvedValue(tokenEntity);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should create a new user and return the user entity', async () => {
      const result = await authService.signup(userCreateDto);

      expect(userService.create).toHaveBeenCalledWith(userCreateDto);
      expect(tokenRepository.create).toHaveBeenCalledWith({
        tokenType: TokenType.EMAIL,
        user: userEntity,
      });
      expect(result).toBe(userEntity);
    });

    it("should call sendGridService sendEmail if user's email is valid", async () => {
      sendGridService.sendEmail = jest.fn();

      await authService.signup(userCreateDto);

      expect(sendGridService.sendEmail).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    let updateAuth: any;
    const userEntity: Partial<UserEntity> = {
      id: 1,
    };

    const updateResult = {};

    beforeEach(() => {
      updateAuth = jest.spyOn(authRepository, 'update');
      updateAuth.mockResolvedValue(updateResult);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should delete the authentication entities based on email', async () => {
      const result = await authService.logout(userEntity as UserEntity);

      const expectedUpdateQuery = {
        userId: userEntity.id,
      };

      expect(authRepository.delete).toHaveBeenCalledWith(expectedUpdateQuery);
      expect(result).toBe(undefined);
    });
  });

  describe('auth', () => {
    const userEntity: Partial<UserEntity> = {
      id: 1,
      email: 'user@example.com',
    };

    const authEntity: Partial<AuthEntity> = {
      id: 1,
    };

    let createAuthMock: any;
    let updateAuthMock: any;
    let jwtSignMock: any;
    let hashTokenMock: any;
    let logoutMock: any;
    beforeEach(() => {
      createAuthMock = jest
        .spyOn(authRepository, 'create' as any)
        .mockResolvedValueOnce(authEntity);

      updateAuthMock = jest
        .spyOn(authRepository, 'update' as any)
        .mockResolvedValueOnce(authEntity);

      jwtSignMock = jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce(MOCK_ACCESS_TOKEN)
        .mockResolvedValueOnce(MOCK_REFRESH_TOKEN);

      hashTokenMock = jest
        .spyOn(authService, 'hashToken')
        .mockReturnValueOnce(MOCK_ACCESS_TOKEN_HASHED)
        .mockReturnValueOnce(MOCK_REFRESH_TOKEN_HASHED);
      logoutMock = jest
        .spyOn(authService, 'logout' as any)
        .mockResolvedValueOnce(undefined);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should create authentication tokens and return them', async () => {
      const findAuthMock = jest
        .spyOn(authRepository, 'findOne' as any)
        .mockResolvedValueOnce(undefined);

      const result = await authService.auth(userEntity as UserEntity);

      expect(findAuthMock).toHaveBeenCalledWith({ userId: userEntity.id });
      expect(updateAuthMock).not.toHaveBeenCalled();
      expect(createAuthMock).toHaveBeenCalledWith({
        user: userEntity,
        refreshToken: MOCK_REFRESH_TOKEN_HASHED,
        accessToken: MOCK_ACCESS_TOKEN_HASHED,
      });
      expect(jwtSignMock).toHaveBeenCalledWith({
        email: userEntity.email,
        userId: userEntity.id,
      });
      expect(jwtSignMock).toHaveBeenLastCalledWith(
        {
          email: userEntity.email,
          userId: userEntity.id,
        },
        {
          expiresIn: undefined,
        },
      );
      expect(logoutMock).not.toHaveBeenCalled();
      expect(hashTokenMock).toHaveBeenCalledWith(MOCK_ACCESS_TOKEN);
      expect(hashTokenMock).toHaveBeenLastCalledWith(MOCK_REFRESH_TOKEN);
      expect(result).toEqual({
        accessToken: MOCK_ACCESS_TOKEN,
        refreshToken: MOCK_REFRESH_TOKEN,
      });
    });

    it('should logout, create authentication tokens and return them', async () => {
      const findAuthMock = jest
        .spyOn(authRepository, 'findOne' as any)
        .mockResolvedValueOnce(authEntity);

      const result = await authService.auth(userEntity as UserEntity);

      expect(findAuthMock).toHaveBeenCalledWith({ userId: userEntity.id });
      expect(updateAuthMock).not.toHaveBeenCalled();
      expect(createAuthMock).toHaveBeenCalledWith({
        user: userEntity,
        refreshToken: MOCK_REFRESH_TOKEN_HASHED,
        accessToken: MOCK_ACCESS_TOKEN_HASHED,
      });
      expect(jwtSignMock).toHaveBeenCalledWith({
        email: userEntity.email,
        userId: userEntity.id,
      });
      expect(jwtSignMock).toHaveBeenLastCalledWith(
        {
          email: userEntity.email,
          userId: userEntity.id,
        },
        {
          expiresIn: undefined,
        },
      );
      expect(logoutMock).toHaveBeenCalled();
      expect(hashTokenMock).toHaveBeenCalledWith(MOCK_ACCESS_TOKEN);
      expect(hashTokenMock).toHaveBeenLastCalledWith(MOCK_REFRESH_TOKEN);
      expect(result).toEqual({
        accessToken: MOCK_ACCESS_TOKEN,
        refreshToken: MOCK_REFRESH_TOKEN,
      });
    });
  });

  describe('forgotPassword', () => {
    const userEntity: Partial<UserEntity> = {
      id: 1,
      email: 'user@example.com',
      status: UserStatus.ACTIVE,
    };

    const tokenEntity = {
      uuid: v4(),
      tokenType: TokenType.EMAIL,
      user: userEntity,
    };

    let createTokenMock: any;

    beforeEach(() => {
      createTokenMock = jest.spyOn(tokenRepository, 'create');

      createTokenMock.mockResolvedValue(tokenEntity);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should throw NotFound exception if user is not found', () => {
      userService.getByEmail = jest.fn().mockResolvedValueOnce(undefined);

      expect(
        authService.forgotPassword({ email: 'user@example.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw Unauthorized exception if user is not active', () => {
      userService.getByEmail = jest
        .fn()
        .mockResolvedValueOnce({ ...userEntity, status: UserStatus.PENDING });

      expect(
        authService.forgotPassword({ email: 'user@example.com' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should create a new token and send email', async () => {
      userService.getByEmail = jest.fn().mockResolvedValueOnce(userEntity);

      sendGridService.sendEmail = jest.fn();
      const email = 'user@example.com';

      await authService.forgotPassword({ email });

      expect(createTokenMock).toHaveBeenCalled();
      expect(sendGridService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          personalizations: [
            {
              dynamicTemplateData: {
                service_name: SERVICE_NAME,
                url: expect.stringContaining(
                  'undefined/reset-password?token=mocked-uuid',
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

    const tokenEntity = {
      uuid: v4(),
      tokenType: TokenType.EMAIL,
      user: userEntity,
      remove: jest.fn(),
    };

    let findTokenMock: any;

    beforeEach(() => {
      findTokenMock = jest.spyOn(tokenRepository, 'findOne');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should throw NotFound exception if token is not found', () => {
      findTokenMock.mockResolvedValueOnce(undefined);

      expect(
        authService.restorePassword({
          token: 'token',
          password: 'password',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update password and send email', async () => {
      findTokenMock.mockResolvedValueOnce(tokenEntity);

      userService.updatePassword = jest.fn();
      sendGridService.sendEmail = jest.fn();

      const updatePasswordMock = jest.spyOn(userService, 'updatePassword');

      await authService.restorePassword({
        token: 'token',
        password: 'password',
      });

      expect(updatePasswordMock).toHaveBeenCalled();
      expect(sendGridService.sendEmail).toHaveBeenCalled();
      expect(tokenEntity.remove).toHaveBeenCalled();
    });
  });

  describe('emailVerification', () => {
    const userEntity: Partial<UserEntity> = {
      id: 1,
      email: 'user@example.com',
    };

    const tokenEntity = {
      uuid: v4(),
      tokenType: TokenType.EMAIL,
      user: userEntity,
      remove: jest.fn(),
    };

    let findTokenMock: any;

    beforeEach(() => {
      findTokenMock = jest.spyOn(tokenRepository, 'findOne');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should throw NotFound exception if token is not found', () => {
      findTokenMock.mockResolvedValueOnce(undefined);

      expect(authService.emailVerification({ token: 'token' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should activate user', async () => {
      findTokenMock.mockResolvedValueOnce(tokenEntity);

      userService.activate = jest.fn();
      const userActivateMock = jest.spyOn(userService, 'activate');

      await authService.emailVerification({ token: 'token' });

      expect(userActivateMock).toHaveBeenCalled();
      expect(tokenEntity.remove).toHaveBeenCalled();
    });
  });

  describe('resendEmailVerification', () => {
    const userEntity: Partial<UserEntity> = {
      id: 1,
      email: 'user@example.com',
      status: UserStatus.PENDING,
    };

    let createTokenMock: any;

    beforeEach(() => {
      createTokenMock = jest.spyOn(tokenRepository, 'create');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should throw NotFound exception if user is not found', () => {
      userService.getByEmail = jest.fn().mockResolvedValueOnce(undefined);

      expect(
        authService.resendEmailVerification({ email: 'user@example.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create token and send email', async () => {
      userService.getByEmail = jest.fn().mockResolvedValueOnce(userEntity);

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
                url: expect.stringContaining('/verify?token=mocked-uuid'),
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
      const nonce = getNonce();
      const nonce1 = getNonce();

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

        const signature = await signMessage(nonce, MOCK_PRIVATE_KEY);
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
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('signup', () => {
      const web3PreSignUpDto: PrepareSignatureDto = {
        address: MOCK_ADDRESS,
        type: SignatureType.SIGNUP,
      };

      const nonce = getNonce();

      const userEntity: Partial<UserEntity> = {
        id: 1,
        evmAddress: web3PreSignUpDto.address,
        nonce,
      };

      const preSignUpDataMock: SignatureBodyDto = {
        from: MOCK_ADDRESS,
        to: MOCK_ADDRESS,
        contents: 'signup',
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
          ...web3PreSignUpDto,
          type: UserType.WORKER,
          signature,
        });

        expect(userService.createWeb3User).toHaveBeenCalledWith(
          web3PreSignUpDto.address,
          UserType.WORKER,
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
        ).rejects.toThrow(ConflictException);
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
        ).rejects.toThrow(BadRequestException);
      });
    });
  });
});
