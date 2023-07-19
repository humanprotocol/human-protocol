import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { TokenRepository } from './token.repository';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { createMock } from '@golevelup/ts-jest';
import { UserRepository } from '../user/user.repository';
import { JwtService } from '@nestjs/jwt';
import { Repository, UpdateResult } from 'typeorm';
import { AuthEntity } from './auth.entity';
import { UserService } from '../user/user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { UserStatus } from '../../common/enums/user';
import { AuthRepository } from './auth.repository';
import { ErrorAuth } from '../../common/constants/errors';
import { MOCK_EXPIRES_IN } from '../../common/test/constants';
import { AuthStatus } from '../../common/enums/auth';
import { IJwt } from '../../common/interfaces/auth';
import { TokenType } from './token.entity';
import { v4 } from 'uuid';


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
          case 'JWT_REFRESH_TOKEN_EXPIRES_IN':
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
            sign: jest.fn(),
          },
        },
        { provide: AuthRepository, useValue: createMock<AuthRepository>() },
        { provide: TokenRepository, useValue: createMock<TokenRepository>() },
        { provide: UserRepository, useValue: createMock<UserRepository>() },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: createMock<HttpService>() },
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
      email: 'test@example.com',
      password: 'password123',
    };
  
    const userEntity: Partial<UserEntity> = {
      id: 1,
      email: signInDto.email,
      password: 'hashedPassword',
    };
  
    const ip = '127.0.0.1';
  
    const jwt = {
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      accessTokenExpiresAt: MOCK_EXPIRES_IN + 3600 * 1000,
      refreshTokenExpiresAt: MOCK_EXPIRES_IN + 86400 * 1000,
    };

    let getByCredentialsMock: any;
  
    beforeEach(() => {
      getByCredentialsMock = jest.spyOn(userService, 'getByCredentials');
      jest.spyOn(authService, 'auth').mockResolvedValue(jwt);
    });
  
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    it('should sign in the user and return the JWT', async () => {
      getByCredentialsMock.mockResolvedValue(userEntity as UserEntity);

      const result = await authService.signin(signInDto, ip);
  
      expect(userService.getByCredentials).toHaveBeenCalledWith(
        signInDto.email,
        signInDto.password,
      );
      expect(authService.auth).toHaveBeenCalledWith(userEntity, ip);
      expect(result).toBe(jwt);
    });
  
    it('should throw UnauthorizedException if user credentials are invalid', async () => {
      getByCredentialsMock.mockResolvedValue(undefined);
  
      await expect(authService.signin(signInDto, ip)).rejects.toThrow(
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
      email: 'test@example.com',
      password: 'password123',
      confirm: 'password123',
    };
  
    const userEntity: Partial<UserEntity> = {
      id: 1,
      email: userCreateDto.email,
      password: 'hashedPassword',
    };
  
    const tokenEntity = {
      uuid: v4(),
      tokenType: TokenType.EMAIL,
      user: userEntity,
    };

    let createUserMock: any,
        createTokenMock: any;
  
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
    const where = { userId: 1 };
  
    const updateResult = {};
  
    beforeEach(() => {
      updateAuth = jest.spyOn(authRepository, 'update');
      updateAuth.mockResolvedValue(updateResult);
    });
  
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    it('should update the authentication entities based on the given condition', async () => {
      const result = await authService.logout(where);
  
      const expectedUpdateQuery = { ...where, status: AuthStatus.ACTIVE };
      const expectedUpdateValues = { status: AuthStatus.EXPIRED };
  
      expect(authRepository.update).toHaveBeenCalledWith(expectedUpdateQuery, expectedUpdateValues);
      expect(result).toBe(undefined);
    });
  });
  

  describe('refresh', () => {
    it('should refresh the JWT for a valid user and return the new JWT', async () => {
      const where = { id: 1 };
      const ip = '127.0.0.1';

      const userEntity: Partial<UserEntity> = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        status: UserStatus.ACTIVE,
      };

      const authEntity: Partial<AuthEntity> = {
        id: 1,
        user: userEntity as UserEntity,
        refreshTokenExpiresAt: MOCK_EXPIRES_IN + 86400 * 1000,
      };

      jest
        .spyOn(authRepository, 'findOne')
        .mockResolvedValue(authEntity as AuthEntity);

      const jwt: IJwt = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        accessTokenExpiresAt: MOCK_EXPIRES_IN + 3600 * 1000,
        refreshTokenExpiresAt: MOCK_EXPIRES_IN + 86400 * 1000,
      };

      jest.spyOn(authService, 'auth').mockResolvedValue(jwt);

      const result = await authService.refresh(where, ip);

      expect(authRepository.findOne).toHaveBeenCalledWith(where, {
        relations: ['user'],
      });
      expect(authService.auth).toHaveBeenCalledWith(authEntity.user, ip);
      expect(result).toBe(jwt);
    });

    it('should throw UnauthorizedException if the refresh token has expired', async () => {
      const where = { id: 1 };
      const ip = '127.0.0.1';

      const userEntity: Partial<UserEntity> = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword',
        status: UserStatus.ACTIVE,
      };

      const authEntity: Partial<AuthEntity> = {
        id: 1,
        user: userEntity as UserEntity,
        refreshTokenExpiresAt: Date.now() - 86400 * 1000,
      };

      jest
        .spyOn(authRepository, 'findOne')
        .mockResolvedValue(authEntity as AuthEntity);

      await expect(authService.refresh(where, ip)).rejects.toThrow(
        ErrorAuth.RefreshTokenHasExpired,
      );

      expect(authRepository.findOne).toHaveBeenCalledWith(where, {
        relations: ['user'],
      });
    });

    it('should throw UnauthorizedException if the user is not active', async () => {
      const where = { id: 1 };
      const ip = '127.0.0.1';

      const userEntity: Partial<UserEntity> = {
        id: 1,
        status: UserStatus.INACTIVE,
      };

      const authEntity: Partial<AuthEntity> = {
        id: 1,
        user: userEntity as UserEntity,
        refreshTokenExpiresAt: MOCK_EXPIRES_IN + 86400 * 1000,
      };

      jest
        .spyOn(authRepository, 'findOne')
        .mockResolvedValue(authEntity as AuthEntity);

      await expect(authService.refresh(where, ip)).rejects.toThrow(
        ErrorAuth.UserNotActive,
      );

      expect(authRepository.findOne).toHaveBeenCalledWith(where, {
        relations: ['user'],
      });
    });
  });

  describe('auth', () => {
    it('should create authentication tokens and return them', async () => {
      const userEntity: Partial<UserEntity> = { id: 1, email: 'user@example.com' };
      const ip = '127.0.0.1';
      const refreshToken = v4();
      const accessTokenExpiresAt = MOCK_EXPIRES_IN * 1000;
      const refreshTokenExpiresAt = MOCK_EXPIRES_IN * 1000;
      const accessToken = 'access-token'

      const logoutMock = jest.spyOn(authService, 'logout').mockResolvedValueOnce(undefined);
      const createAuthMock = jest.spyOn(authRepository, 'create' as any).mockResolvedValueOnce(undefined);
      const jwtSignMock = jest.spyOn(jwtService, 'sign').mockReturnValue(accessToken);

      const result = await authService.auth(userEntity as UserEntity, ip);

      expect(logoutMock).toHaveBeenCalledWith({ userId: userEntity.id });
      expect(createAuthMock).toHaveBeenCalledWith({
        user: userEntity,
        refreshToken,
        refreshTokenExpiresAt: expect.any(Number),
        ip,
        status: AuthStatus.ACTIVE,
      });
      expect(jwtSignMock).toHaveBeenCalledWith({ email: userEntity.email }, { expiresIn: expect.any(Number) });
      expect(result).toEqual({
        accessToken,
        refreshToken,
        accessTokenExpiresAt: expect.any(Number),
        refreshTokenExpiresAt: expect.any(Number)
      });
    });
  });
});

