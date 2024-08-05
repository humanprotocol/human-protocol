import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Mutex, MutexInterface, withTimeout, E_TIMEOUT } from 'async-mutex';

@Injectable()
export class MutexManagerService implements OnModuleDestroy {
  private mutexes: WeakMap<object, MutexInterface> = new WeakMap();
  private mutexTimeouts: Map<object, NodeJS.Timeout> = new Map();
  private mutexTimeoutDuration = 120000; // 2 minutes

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
      const result = await mutex.runExclusive(async () => {
        console.log(`Lock acquired for ${key}, executing function...`);
        return await callback();
      });
      return result;
    } catch (e) {
      if (e === E_TIMEOUT) {
        console.error(`Function execution timed out for ${key}`);
        throw new Error(`Function execution timed out for ${key}`);
      }
      console.error(`Function execution failed for ${key}`, e);
      throw new Error(`Function execution failed for ${key}`);
    }
  }

  onModuleDestroy() {
    this.mutexTimeouts.forEach((timeout) => clearTimeout(timeout));
  }
}
