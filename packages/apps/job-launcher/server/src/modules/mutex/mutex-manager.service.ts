import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Mutex, MutexInterface, withTimeout, E_TIMEOUT } from 'async-mutex';
import { ControlledError } from '../../common/errors/controlled';

@Injectable()
export class MutexManagerService implements OnModuleDestroy {
  private mutexes: WeakMap<object, MutexInterface> = new WeakMap();
  private mutexTimeouts: Map<object, NodeJS.Timeout> = new Map();
  private mutexTimeoutDuration = 120000; // 2 minutes
  public readonly logger = new Logger(MutexManagerService.name);

  private getMutex(key: object, timeout: number): MutexInterface {
    if (!this.mutexes.has(key)) {
      const mutex: MutexInterface = withTimeout(
        new Mutex(),
        timeout,
      ) as unknown as MutexInterface;
      this.mutexes.set(key, mutex);
      this.scheduleMutexCleanup(key);
    }
    this.scheduleMutexCleanup(key); // Reset timeout on access
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.mutexes.get(key)!;
  }

  private scheduleMutexCleanup(key: object): void {
    if (this.mutexTimeouts.has(key)) {
      clearTimeout(this.mutexTimeouts.get(key));
    }
    const timeout = setTimeout(
      () => this.cleanupMutex(key),
      this.mutexTimeoutDuration,
    );
    this.mutexTimeouts.set(key, timeout);
  }

  private cleanupMutex(key: object): void {
    this.mutexes.delete(key);
    this.mutexTimeouts.delete(key);
  }

  async runExclusive<T>(
    key: object,
    timeout: number,
    callback: () => Promise<T>,
  ): Promise<T> {
    const mutex = this.getMutex(key, timeout);
    try {
      this.logger.log(
        `Attempting to acquire lock for ${(key as any).id as string}...`,
      );
      const result = await mutex.runExclusive(async () => {
        this.logger.log(
          `Lock acquired for ${(key as any).id as string}, executing function...`,
        );
        this.logger.log(
          `Function executed for ${(key as any).id as string}, lock released.`,
        );
        return await callback();
      });
      return result;
    } catch (e) {
      if (e instanceof ControlledError) {
        throw e;
      }
      if (e === E_TIMEOUT) {
        this.logger.error(
          `Function execution timed out for ${(key as any).id as string}`,
        );
        throw new Error(
          `Function execution timed out for ${(key as any).id as string}`,
        );
      }
      this.logger.error(
        `Function execution failed for ${(key as any).id as string}`,
        e,
      );
      throw new Error(
        `Function execution failed for ${(key as any).id as string}`,
      );
    }
  }

  onModuleDestroy() {
    this.mutexTimeouts.forEach((timeout) => clearTimeout(timeout));
  }
}
