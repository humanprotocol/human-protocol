import { sleep } from './sleep';

describe('sleep', () => {
  it('should resolve after the specified duration', async () => {
    const start = Date.now();
    const duration = 100; // 100 ms

    await sleep(duration);

    const end = Date.now();
    const elapsed = end - start;

    expect(elapsed).toBeGreaterThanOrEqual(duration);
    expect(elapsed).toBeLessThanOrEqual(duration + 20);
  });

  it('should resolve almost immediately for a duration of 0 ms', async () => {
    const start = Date.now();

    await sleep(0);

    const end = Date.now();
    const elapsed = end - start;

    expect(elapsed).toBeLessThanOrEqual(10);
  });

  it('should handle large durations correctly', async () => {
    const start = Date.now();
    const duration = 1000;

    await sleep(duration);

    const end = Date.now();
    const elapsed = end - start;

    expect(elapsed).toBeGreaterThanOrEqual(duration);
    expect(elapsed).toBeLessThanOrEqual(duration + 50);
  });

  it('should not resolve too early', async () => {
    const start = Date.now();
    const duration = 200;

    const sleepPromise = sleep(duration);

    const midway = Date.now();
    expect(midway - start).toBeLessThanOrEqual(duration);
    await sleepPromise;

    const end = Date.now();
    const elapsed = end - start;

    expect(elapsed).toBeGreaterThanOrEqual(duration);
  });
});

describe('sleep with cancellation', () => {
  it('should be cancellable with a timeout using AbortController', async () => {
    jest.useFakeTimers();

    const controller = new AbortController();
    const signal = controller.signal;
    const sleepPromise = sleep(1000, signal);

    // Simulate aborting the sleep
    setTimeout(() => controller.abort(), 500);
    jest.advanceTimersByTime(500);

    await expect(sleepPromise).rejects.toThrow('Sleep cancelled');

    jest.useRealTimers();
  });
});
