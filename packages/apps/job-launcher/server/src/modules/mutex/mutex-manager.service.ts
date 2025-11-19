import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { E_TIMEOUT, Mutex, MutexInterface, withTimeout } from 'async-mutex';
import { BaseError, ServerError } from '../../common/errors';
import logger from '../../logger';

@Injectable()
export class MutexManagerService implements OnModuleDestroy {
  private mutexes: Map<string, MutexInterface> = new Map();
  private mutexTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private mutexTimeoutDuration = 120000; // 2 minutes
  private readonly logger = logger.child({ context: MutexManagerService.name });

  private getMutex(key: string, timeout: number): MutexInterface {
    if (!this.mutexes.has(key)) {
      const mutex: MutexInterface = withTimeout(
        new Mutex(),
        timeout,
      ) as unknown as MutexInterface;
      this.mutexes.set(key, mutex);
      this.scheduleMutexCleanup(key);
    }
    this.scheduleMutexCleanup(key); // Reset timeout on access

    return this.mutexes.get(key)!;
  }

  private scheduleMutexCleanup(key: string): void {
    if (this.mutexTimeouts.has(key)) {
      clearTimeout(this.mutexTimeouts.get(key));
    }
    const timeout = setTimeout(
      () => this.cleanupMutex(key),
      this.mutexTimeoutDuration,
    );
    this.mutexTimeouts.set(key, timeout);
  }

  private cleanupMutex(key: string): void {
    this.mutexes.delete(key);
    this.mutexTimeouts.delete(key);
  }

  async runExclusive<T>(
    key: string,
    timeout: number,
    callback: () => Promise<T>,
  ): Promise<T> {
    const mutex = this.getMutex(key, timeout);
    try {
      this.logger.debug('Attempting to acquire lock for key', {
        key,
      });

      const result = await mutex.runExclusive(async () => {
        this.logger.debug('`Lock acquired for key', {
          key,
        });
        return await callback();
      });

      this.logger.debug('Function executed for key, lock released', {
        key,
      });

      return result;
    } catch (error) {
      if (error === E_TIMEOUT) {
        const errorMessage = 'Function execution timed out for key';
        this.logger.error(errorMessage, { key });
        throw new ServerError(errorMessage);
      }

      if (error instanceof BaseError) {
        throw error;
      }

      const errorMessage = 'Function execution failed for key';
      this.logger.error(errorMessage, { key, error });
      throw new ServerError(errorMessage);
    }
  }

  onModuleDestroy() {
    this.mutexTimeouts.forEach((timeout) => clearTimeout(timeout));
  }
}
