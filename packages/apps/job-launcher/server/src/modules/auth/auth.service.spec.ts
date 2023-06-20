import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { TokenRepository } from './token.repository';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UserRepository } from '../user/user.repository';
import { JwtService } from '@nestjs/jwt';
import { DeleteResult, Repository } from 'typeorm';
import { AuthEntity } from './auth.entity';
import { UserService } from '../user/user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IJwt, SignInDto } from './auth.dto';
import { UserEntity } from '../user/user.entity';
import { UnauthorizedException } from '@nestjs/common';
import { UserCreateDto } from '../user/user.dto';
import { TokenEntity, TokenType } from './token.entity';
import { v4 } from 'uuid';
import { UserStatus } from '../../common/enums/user';
import { AuthRepository } from './auth.repository';
import { ErrorAuth } from '../../common/constants/errors';

const MOCK_EXPIRES_IN = 1787260813820;

jest.mock('@human-protocol/sdk');

describe('AuthService', () => {
  let authService: AuthService;
  let tokenRepository: DeepMocked<TokenRepository>;
  let userService: UserService;
  let authRepository: DeepMocked<AuthRepository>;
  let jwtService: JwtService;

  beforeEach(async () => {
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
        UserService,{
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
    it('should sign in the user and return the JWT', async () => {
      const signInDto: SignInDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const userEntity: Partial<UserEntity> = {
        id: 1,
        email: signInDto.email,
        password: 'hashedPassword',
      };

      const ip = '127.0.0.1';

      jest
        .spyOn(userService, 'getByCredentials')
        .mockResolvedValue(userEntity as UserEntity);

      const jwt: IJwt = {
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        accessTokenExpiresAt: MOCK_EXPIRES_IN + 3600 * 1000,
        refreshTokenExpiresAt: MOCK_EXPIRES_IN + 86400 * 1000,
      };

      jest.spyOn(authService, 'auth').mockResolvedValue(jwt);

      const result = await authService.signin(signInDto, ip);

      expect(userService.getByCredentials).toHaveBeenCalledWith(
        signInDto.email,
        signInDto.password,
      );
      expect(authService.auth).toHaveBeenCalledWith(userEntity, ip);
      expect(result).toBe(jwt);
    });

    it('should throw UnauthorizedException if user credentials are invalid', async () => {
      const signInDto: SignInDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      jest
        .spyOn(authRepository, 'create' as any)
        .mockResolvedValue({});

      jest
        .spyOn(userService, 'getByCredentials' as any)
        .mockResolvedValue(undefined);

      await expect(authService.signin(signInDto, '127.0.0.1')).rejects.toThrow(
        ErrorAuth.InvalidEmailOrPassword,
      );

      expect(userService.getByCredentials).toHaveBeenCalledWith(
        signInDto.email,
        signInDto.password,
      );
    });
  });

  describe('signup', () => {
    it('should create a new user and return the user entity', async () => {
      const userCreateDto: UserCreateDto = {
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

      jest.spyOn(userService, 'create').mockResolvedValue(userEntity as UserEntity);
      jest.spyOn(tokenRepository, 'create').mockResolvedValue(tokenEntity as TokenEntity);

      const result = await authService.signup(userCreateDto);

      expect(userService.create).toHaveBeenCalledWith(userCreateDto);
      expect(tokenRepository.create).toHaveBeenCalledWith({
        tokenType: TokenType.EMAIL,
        user: userEntity,
      });
      // expect other assertions as needed
      expect(result).toBe(userEntity);
    });
  });

  describe('logout', () => {
    it('should delete the authentication entities based on the given condition', async () => {
      const where = { id: 1 };

      const deleteResult: Partial<DeleteResult> = {
        affected: 1,
      };

      jest.spyOn(authRepository, 'delete').mockResolvedValue(deleteResult as DeleteResult);

      const result = await authService.logout(where);

      expect(authRepository.delete).toHaveBeenCalledWith(where);
      expect(result).toBe(deleteResult);
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
      }
      
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
      expect(authService.auth).toHaveBeenCalledWith(
        authEntity.user,
        ip,
      );
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
      }

      const authEntity: Partial<AuthEntity> = {
        id: 1,
        user: userEntity as UserEntity,
        refreshTokenExpiresAt: Date.now() - 86400 * 1000,
      };

      jest
        .spyOn(authRepository, 'findOne')
        .mockResolvedValue(authEntity as AuthEntity);

      await expect(authService.refresh(where, ip)).rejects.toThrow(
        ErrorAuth.RefreshTokenHasExpired
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
        status: UserStatus.INACTIVE
      }

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

  // TODO: Refactor it
  describe.skip('auth', () => {
    it('should create a new authentication entity and return the JWT', async () => {
      const userEntity: Partial<UserEntity> = {
        id: 1,
        email: 'test@example.com',
        password: 'hashedPassword'
      };

      const refreshToken = v4();

      const accessTokenExpiresIn = 3600;
      const refreshTokenExpiresIn = 86400;

      const dateNow = MOCK_EXPIRES_IN;
      const accessTokenExpiresAt = dateNow + accessTokenExpiresIn * 1000;
      const refreshTokenExpiresAt = dateNow + refreshTokenExpiresIn * 1000;

      jest
        .spyOn(authRepository, 'create')
        .mockImplementation((args) => args as any);

      const jwt: IJwt = {
        accessToken: 'access_token',
        refreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
      };

      jest.spyOn(jwtService, 'sign').mockReturnValue('access_token');

      const result = await authService.auth(userEntity as UserEntity, '127.0.0.1');

      expect(authRepository.create).toHaveBeenCalledWith({
        user: userEntity,
        refreshToken,
        refreshTokenExpiresAt,
        ip: '127.0.0.1',
      });
      expect(authRepository.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(jwt);
    });
  });
});
