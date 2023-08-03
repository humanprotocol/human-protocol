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
  MOCK_EMAIL,
  MOCK_EXPIRES_IN,
  MOCK_HASHED_PASSWORD,
  MOCK_PASSWORD,
} from '../../../test/constants';
import { AuthStatus } from '../../common/enums/auth';
import { TokenType } from './token.entity';
import { v4 } from 'uuid';
import { PaymentService } from '../payment/payment.service';
import { UserStatus } from '../../common/enums/user';

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

  beforeAll(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string, defaultValue?: any) => {
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
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    authRepository = moduleRef.get(AuthRepository);
    tokenRepository = moduleRef.get(TokenRepository);
    userService = moduleRef.get<UserService>(UserService);
    jwtService = moduleRef.get<JwtService>(JwtService);
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
      jest.spyOn(authService, 'auth').mockResolvedValue(MOCK_ACCESS_TOKEN);
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
      expect(result).toBe(MOCK_ACCESS_TOKEN);
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

    it('should update the authentication entities based on the given condition', async () => {
      const result = await authService.logout(userEntity as UserEntity);

      const expectedUpdateQuery = {
        userId: userEntity.id,
        status: AuthStatus.ACTIVE,
      };
      const expectedUpdateValues = { status: AuthStatus.EXPIRED };

      expect(authRepository.update).toHaveBeenCalledWith(
        expectedUpdateQuery,
        expectedUpdateValues,
      );
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

    const refreshToken = v4();
    const accessToken = MOCK_ACCESS_TOKEN;
    let createAuthMock: any;
    let updateAuthMock: any;
    let jwtSignMock: any;
    beforeEach(() => {
      createAuthMock = jest
        .spyOn(authRepository, 'create' as any)
        .mockResolvedValueOnce(authEntity);

      updateAuthMock = jest
        .spyOn(authRepository, 'update' as any)
        .mockResolvedValueOnce(authEntity);

      jwtSignMock = jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce(accessToken);
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
        refreshToken: refreshToken,
        status: AuthStatus.ACTIVE,
      });
      expect(jwtSignMock).toHaveBeenCalledWith({
        refreshToken: refreshToken,
        email: userEntity.email,
      });
      expect(result).toEqual(accessToken);
    });

    it('should refresh authentication tokens and return them', async () => {
      const findAuthMock = jest
        .spyOn(authRepository, 'findOne' as any)
        .mockResolvedValueOnce(authEntity);

      const result = await authService.auth(userEntity as UserEntity);

      expect(findAuthMock).toHaveBeenCalledWith({ userId: userEntity.id });
      expect(updateAuthMock).toHaveBeenCalledWith(
        { id: authEntity.id },
        { status: AuthStatus.ACTIVE, refreshToken },
      );
      expect(createAuthMock).not.toHaveBeenCalled();
      expect(jwtSignMock).toHaveBeenCalledWith({
        refreshToken: refreshToken,
        email: userEntity.email,
      });
      expect(result).toEqual(accessToken);
    });
  });
});
