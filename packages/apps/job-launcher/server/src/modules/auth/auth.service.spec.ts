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
  MOCK_EMAIL,
  MOCK_EXPIRES_IN,
  MOCK_HASHED_PASSWORD,
  MOCK_PASSWORD,
  MOCK_REFRESH_TOKEN,
  MOCK_REFRESH_TOKEN_HASHED,
} from '../../../test/constants';
import { TokenType } from './token.entity';
import { v4 } from 'uuid';
import { PaymentService } from '../payment/payment.service';
import { UserStatus } from '../../common/enums/user';
import { SendGridService } from '../sendgrid/sendgrid.service';

jest.mock('@human-protocol/sdk');

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
        { provide: PaymentService, useValue: createMock<PaymentService>() },
        { provide: SendGridService, useValue: createMock<SendGridService>() },
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    authRepository = moduleRef.get(AuthRepository);
    tokenRepository = moduleRef.get(TokenRepository);
    userService = moduleRef.get<UserService>(UserService);
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
      confirm: MOCK_PASSWORD,
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
});
