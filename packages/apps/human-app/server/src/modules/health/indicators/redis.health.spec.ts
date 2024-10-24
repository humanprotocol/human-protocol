import { HealthCheckError } from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis.health';

describe('RedisHealthIndicator', () => {
  const redisClientMock = {
    ping: jest.fn(),
  };

  const redisHealthIndicator = new RedisHealthIndicator();

  afterEach(() => {
    redisClientMock.ping.mockReset();
  });

  describe('isHealty', () => {
    it('should return healthy status if can ping', async () => {
      redisClientMock.ping.mockResolvedValueOnce('PONG');

      const testKey = 'test-key-1';

      const healthIndicatorResult = await redisHealthIndicator.isHealthy(
        testKey,
        redisClientMock,
      );

      expect(healthIndicatorResult).toEqual({
        [testKey]: { status: 'up' },
      });
    });

    it(`should throw with unhealthy status if can't ping`, async () => {
      const mockNetworkError = new Error('Ooops! Redis network error');
      redisClientMock.ping.mockRejectedValueOnce(mockNetworkError);

      const testKey = 'test-key-2';

      let thrownError;
      try {
        await redisHealthIndicator.isHealthy(testKey, redisClientMock);
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
