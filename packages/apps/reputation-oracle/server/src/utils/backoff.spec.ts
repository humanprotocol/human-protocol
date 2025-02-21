import { faker } from '@faker-js/faker/.';
import { calculateExponentialBackoffMs } from './backoff';

describe('Backoff utilities', () => {
  describe('calculateExponentialBackoffMs', () => {
    const testBackoffIntervalSeconds = faker.number.int({ max: 42 });

    it('should return correct backoff for the first retry', () => {
      const retriesCount = 0;
      const result = calculateExponentialBackoffMs(
        retriesCount,
        testBackoffIntervalSeconds,
      );
      expect(result).toBe(testBackoffIntervalSeconds * 1000);
    });

    it('should return correct backoff for the second retry', () => {
      const retriesCount = 1;
      const result = calculateExponentialBackoffMs(
        retriesCount,
        testBackoffIntervalSeconds,
      );
      expect(result).toBe(2 * testBackoffIntervalSeconds * 1000);
    });

    it('should return correct backoff for the third retry ', () => {
      const retriesCount = 2;
      const result = calculateExponentialBackoffMs(
        retriesCount,
        testBackoffIntervalSeconds,
      );
      expect(result).toBe(4 * testBackoffIntervalSeconds * 1000);
    });

    it('should return correct backoff for the sixth retry', () => {
      const retriesCount = 5;
      const result = calculateExponentialBackoffMs(
        retriesCount,
        testBackoffIntervalSeconds,
      );
      expect(result).toBe(32 * testBackoffIntervalSeconds * 1000);
    });
  });
});
