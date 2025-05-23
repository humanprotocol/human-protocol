import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WhitelistService } from '../../modules/whitelist/whitelist.service';
import { AuthError } from '../errors';
import { WhitelistAuthGuard } from './whitelist.auth';

describe('WhitelistAuthGuard', () => {
  let guard: WhitelistAuthGuard;
  let whitelistService: Partial<WhitelistService>;

  beforeEach(async () => {
    whitelistService = {
      isUserWhitelisted: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhitelistAuthGuard,
        { provide: WhitelistService, useValue: whitelistService },
      ],
    }).compile();

    guard = module.get<WhitelistAuthGuard>(WhitelistAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw an error if user is not found in the request', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user: null }),
      }),
    };

    await expect(
      guard.canActivate(mockContext as ExecutionContext),
    ).rejects.toThrow(new AuthError('User not found.'));
  });

  it('should throw an error if the user is not whitelisted', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'user-id-123' },
        }),
      }),
    };

    (whitelistService.isUserWhitelisted as jest.Mock).mockResolvedValue(false);

    await expect(
      guard.canActivate(mockContext as ExecutionContext),
    ).rejects.toThrow(new AuthError('Unauthorized.'));
  });

  it('should return true if the user is whitelisted', async () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { id: 'user-id-123' },
        }),
      }),
    };

    (whitelistService.isUserWhitelisted as jest.Mock).mockResolvedValue(true);

    const result = await guard.canActivate(mockContext as ExecutionContext);
    expect(result).toBe(true);
    expect(whitelistService.isUserWhitelisted).toHaveBeenCalledWith(
      'user-id-123',
    );
  });
});
