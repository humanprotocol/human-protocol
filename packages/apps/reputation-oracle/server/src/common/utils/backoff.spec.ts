import { calculateExponentialBackoffMs } from './backoff';

describe('calculateExponentialBackoffMs', () => {
  it('should return 2 minutes backoff for the first retry (retriesCount = 0)', () => {
    const retriesCount = 0;
    const result = calculateExponentialBackoffMs(retriesCount);
    expect(result).toBe(120 * 1000); // 2 minutes in milliseconds
  });

  it('should return 4 minutes backoff for the second retry (retriesCount = 1)', () => {
    const retriesCount = 1;
    const result = calculateExponentialBackoffMs(retriesCount);
    expect(result).toBe(2 * 120 * 1000); // 4 minutes in milliseconds
  });

  it('should return 8 minutes backoff for the third retry (retriesCount = 2)', () => {
    const retriesCount = 2;
    const result = calculateExponentialBackoffMs(retriesCount);
    expect(result).toBe(4 * 120 * 1000); // 8 minutes in milliseconds
  });

  it('should return 64 minutes backoff for the sixth retry (retriesCount = 5)', () => {
    const retriesCount = 5;
    const result = calculateExponentialBackoffMs(retriesCount);
    expect(result).toBe(32 * 120 * 1000); // 64 minutes in milliseconds
  });
});
