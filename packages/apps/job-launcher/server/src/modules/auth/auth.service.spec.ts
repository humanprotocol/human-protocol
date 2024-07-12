import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { TokenRepository } from './token.repository';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { createMock } from '@golevelup/ts-jest';
import { UserRepository } from '../user/user.repository';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { UserEntity } from '../user/user.entity';
import { ErrorAuth, ErrorUser } from '../../common/constants/errors';
import {
  MOCK_ACCESS_TOKEN,
  MOCK_EMAIL,
  MOCK_EXPIRES_IN,
  MOCK_HASHED_PASSWORD,
  MOCK_PASSWORD,
  MOCK_REFRESH_TOKEN,
} from '../../../test/constants';
import { TokenEntity, TokenType } from './token.entity';
import { v4 } from 'uuid';
import { PaymentService } from '../payment/payment.service';
import { UserStatus } from '../../common/enums/user';
import { SendGridService } from '../sendgrid/sendgrid.service';
import { SENDGRID_TEMPLATES, SERVICE_NAME } from '../../common/constants';
import { ApiKeyRepository } from './apikey.repository';
import { ServerConfigService } from '../../common/config/server-config.service';
import { AuthConfigService } from '../../common/config/auth-config.service';
import { ControlledError } from '../../common/errors/controlled';
import { HttpStatus } from '@nestjs/common';

jest.mock('@human-protocol/sdk');
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

  beforeAll(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'JWT_ACCESS_TOKEN_EXPIRES_IN':
            return MOCK_EXPIRES_IN;
        }
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        UserService,
        ServerConfigService,
        AuthConfigService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        { provide: TokenRepository, useValue: createMock<TokenRepository>() },
        { provide: UserRepository, useValue: createMock<UserRepository>() },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: createMock<HttpService>() },
        { provide: PaymentService, useValue: createMock<PaymentService>() },
        { provide: SendGridService, useValue: createMock<SendGridService>() },
        { provide: ApiKeyRepository, useValue: createMock<ApiKeyRepository>() },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    tokenRepository = moduleRef.get<TokenRepository>(TokenRepository);
    userService = moduleRef.get<UserService>(UserService);
    userRepository = moduleRef.get<UserRepository>(UserRepository);
    jwtService = moduleRef.get<JwtService>(JwtService);
    sendGridService = moduleRef.get<SendGridService>(SendGridService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('signin', () => {
    const signInDto = {
      email: MOCK_EMAIL,
      password: MOCK_PASSWORD,
      hCaptchaToken: 'token',
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
        new ControlledError(
          ErrorAuth.InvalidEmailOrPassword,
          HttpStatus.FORBIDDEN,
        ),
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

      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
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
        .spyOn(userRepository, 'findByEmail')
        .mockResolvedValue(userEntity as any);

      await expect(authService.signup(userCreateDto)).rejects.toThrow(
        new ControlledError(ErrorUser.DuplicatedEmail, HttpStatus.BAD_REQUEST),
      );

      expect(userRepository.findByEmail).toHaveBeenCalledWith(userEntity.email);
    });
  });

  describe('auth', () => {
    let jwtSignMock: any, findTokenMock: any;

    const userEntity: Partial<UserEntity> = {
      id: 1,
      email: 'user@example.com',
    };

    const tokenEntity: Partial<TokenEntity> = {
      uuid: v4(),
      type: TokenType.REFRESH,
      user: userEntity as UserEntity,
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

      const result = await authService.auth(userEntity as UserEntity);
      expect(findTokenMock).toHaveBeenCalledWith(
        userEntity.id,
        TokenType.REFRESH,
      );
      expect(jwtSignMock).toHaveBeenLastCalledWith(
        {
          email: userEntity.email,
          userId: userEntity.id,
        },
        {
          expiresIn: MOCK_EXPIRES_IN,
        },
      );
      expect(result).toEqual({
        accessToken: MOCK_ACCESS_TOKEN,
        refreshToken: undefined,
      });
    });

    it('should remove the refresh token if one already exists', async () => {
      findTokenMock = jest
        .spyOn(tokenRepository, 'findOneByUserIdAndType')
        .mockResolvedValueOnce(tokenEntity as TokenEntity);
      const deleteMock = jest.spyOn(tokenRepository, 'deleteOne');

      const result = await authService.auth(userEntity as UserEntity);

      expect(findTokenMock).toHaveBeenCalledWith(
        userEntity.id,
        TokenType.REFRESH,
      );
      expect(jwtSignMock).toHaveBeenLastCalledWith(
        {
          email: userEntity.email,
          userId: userEntity.id,
        },
        {
          expiresIn: MOCK_EXPIRES_IN,
        },
      );
      expect(deleteMock).toHaveBeenCalledWith(tokenEntity);
      expect(result).toEqual({
        accessToken: MOCK_ACCESS_TOKEN,
        refreshToken: undefined,
      });
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
                url: expect.stringContaining('undefined/reset-password?token='),
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

    beforeAll(() => {
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
      status: UserStatus.PENDING,
    };

    const tokenEntity: Partial<TokenEntity> = {
      uuid: v4(),
      type: TokenType.EMAIL,
      user: userEntity as UserEntity,
    };

    let findTokenMock: any;

    beforeAll(() => {
      findTokenMock = jest.spyOn(tokenRepository, 'findOneByUuidAndType');
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should throw an error if token is not found', () => {
      findTokenMock.mockResolvedValue(null);
      expect(authService.emailVerification({ token: 'token' })).rejects.toThrow(
        new ControlledError(ErrorAuth.NotFound, HttpStatus.FORBIDDEN),
      );
    });
    it('should throw an error if token is expired', () => {
      tokenEntity.expiresAt = new Date(new Date().getDate() - 1);
      findTokenMock.mockResolvedValue(tokenEntity as TokenEntity);
      expect(authService.emailVerification({ token: 'token' })).rejects.toThrow(
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
});
