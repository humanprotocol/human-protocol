import { HealthCheckError } from '@nestjs/terminus';
import type { Cache } from 'cache-manager';
import { CacheManagerHealthIndicator } from './cache-manager.health';

describe('CacheManagerHealthIndicator', () => {
  const cacheManagerMock = {
    get: jest.fn(),
  };

  const cacheManagerHealthIndicator = new CacheManagerHealthIndicator();

  afterEach(() => {
    cacheManagerMock.get.mockReset();
  });

  describe('isHealty', () => {
    it('should return healthy status if can ping', async () => {
      cacheManagerMock.get.mockResolvedValueOnce(null);

      const testKey = 'test-key-1';

      const healthIndicatorResult = await cacheManagerHealthIndicator.isHealthy(
        testKey,
        cacheManagerMock as unknown as Cache,
      );

      expect(healthIndicatorResult).toEqual({
        [testKey]: { status: 'up' },
      });
    });

    it(`should throw with unhealthy status if can't ping`, async () => {
      const mockNetworkError = new Error('Ooops! Redis network error');
      cacheManagerMock.get.mockRejectedValueOnce(mockNetworkError);

      const testKey = 'test-key-2';

      let thrownError;
      try {
        await cacheManagerHealthIndicator.isHealthy(
          testKey,
          cacheManagerMock as unknown as Cache,
        );
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(HealthCheckError);
      expect(thrownError.causes).toEqual({
        [testKey]: { status: 'down' },
      });
    });
  });
});
