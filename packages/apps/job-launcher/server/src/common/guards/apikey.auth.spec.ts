import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../modules/auth/auth.service';
import { UserEntity } from '../../modules/user/user.entity';
import { AuthError } from '../errors';
import { ApiKeyGuard } from './apikey.auth';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        {
          provide: AuthService,
          useValue: {
            validateAPIKeyAndGetUser: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const userEntity: Partial<UserEntity> = {
      id: 1,
      email: 'user@example.com',
    };
    it('should return true if API key is valid', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              'x-api-key': 'testKey-123',
            },
            user: null,
          }),
        }),
      } as ExecutionContext;

      jest
        .spyOn(authService, 'validateAPIKeyAndGetUser')
        .mockResolvedValue(userEntity as UserEntity);

      expect(await guard.canActivate(context)).toBe(true);
    });

    it('should throw UnauthorizedException if API key is invalid', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              'x-api-key': 'invalidKey-123',
            },
            user: null,
          }),
        }),
      } as ExecutionContext;

      jest
        .spyOn(authService, 'validateAPIKeyAndGetUser')
        .mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new AuthError('Unauthorized'),
      );
    });

    it('should throw UnauthorizedException for invalid API key format', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              'x-api-key': 'invalidformat',
            },
            user: null,
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid API Key',
      );
    });
  });
});
