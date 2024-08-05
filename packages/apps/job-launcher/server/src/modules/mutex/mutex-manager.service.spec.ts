import { Test, TestingModule } from '@nestjs/testing';
import { MutexManagerService } from './mutex-manager.service';

const timeout = 1000;

describe('MutexManagerService', () => {
  let service: MutexManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MutexManagerService],
    }).compile();

    service = module.get<MutexManagerService>(MutexManagerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should handle exclusive execution', async () => {
    let task1Executed = false;
    let task2Executed = false;

    const userId = { id: 'user1' };

    const task1 = service.runExclusive(userId, timeout, async () => {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async work
      task1Executed = true;
    });

    const task2 = service.runExclusive(userId, timeout, async () => {
      await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate async work
      task2Executed = true;
    });

    await Promise.all([task1, task2]);

    expect(task1Executed).toBe(true);
    expect(task2Executed).toBe(true);
  });

  it('should timeout if lock is not acquired in time', async () => {
    const userId = { id: 'user2' };

    // Simulate a long async work to hold the lock
    service.runExclusive(userId, timeout, async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500)); // 1500ms exceeds the 100ms timeout
    });

    // This should timeout as the lock is held by the above function
    await expect(
      service.runExclusive(userId, timeout, async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate async work
      }),
    ).rejects.toThrow('Function execution timed out for user2');
  });
});
