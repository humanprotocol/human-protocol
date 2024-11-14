import { calculateBackoff } from './cron';

describe('calculateBackoff', () => {
  it('should return 1 minute backoff for the first retry (retriesCount = 0)', () => {
    const retriesCount = 0;
    const result = calculateBackoff(retriesCount);
    expect(result).toBe(60 * 1000); // 1 minute in milliseconds
  });

  it('should return 2 minutes backoff for the second retry (retriesCount = 1)', () => {
    const retriesCount = 1;
    const result = calculateBackoff(retriesCount);
    expect(result).toBe(2 * 60 * 1000); // 2 minutes in milliseconds
  });

  it('should return 4 minutes backoff for the third retry (retriesCount = 2)', () => {
    const retriesCount = 2;
    const result = calculateBackoff(retriesCount);
    expect(result).toBe(4 * 60 * 1000); // 4 minutes in milliseconds
  });

  it('should return 32 minutes backoff for the sixth retry (retriesCount = 5)', () => {
    const retriesCount = 5;
    const result = calculateBackoff(retriesCount);
    expect(result).toBe(32 * 60 * 1000); // 32 minutes in milliseconds
  });

  it('should calculate backoff with a custom interval', () => {
    const retriesCount = 2;
    const customInterval = 120; // Custom interval of 120 seconds
    const result = calculateBackoff(retriesCount, customInterval);
    expect(result).toBe(4 * 120 * 1000); // 4 intervals of 120 seconds in milliseconds
  });
});
