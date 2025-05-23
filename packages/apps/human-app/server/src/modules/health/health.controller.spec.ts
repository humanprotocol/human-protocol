import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { EnvironmentConfigService } from '../../common/config/environment-config.service';
import { ConfigModule } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { CacheManagerHealthIndicator } from './indicators/cache-manager.health';

const cacheManagerMock = {
  get: jest.fn(),
};

describe('HealthController', () => {
  let healthController: HealthController;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TerminusModule,
        ConfigModule.forRoot({
          envFilePath: '.env',
          isGlobal: true,
        }),
      ],
      controllers: [HealthController],
      providers: [
        CacheManagerHealthIndicator,
        EnvironmentConfigService,
        { provide: CACHE_MANAGER, useValue: cacheManagerMock },
      ],
    }).compile();

    healthController = moduleRef.get(HealthController);
  });

  it('/ping should return proper info', async () => {
    await expect(healthController.ping()).resolves.toEqual({
      gitHash: 'test_value_hardcoded_in_jest_config',
    });
  });

  describe('/check', () => {
    afterEach(() => {
      cacheManagerMock.get.mockReset();
    });

    it(`returns 'up' status when cache-manager redis is up`, async () => {
      await expect(healthController.check()).resolves.toEqual(
        expect.objectContaining({
          status: 'ok',
          info: {
            'cache-manager': {
              status: 'up',
            },
          },
        }),
      );
    });

    it(`returns 'down' status when cache-manager redis is down`, async () => {
      cacheManagerMock.get.mockRejectedValueOnce(new Error());

      let thrownError;
      try {
        await healthController.check();
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toBeInstanceOf(ServiceUnavailableException);
      expect(thrownError.response).toEqual(
        expect.objectContaining({
          status: 'error',
          info: {},
          error: {
            'cache-manager': {
              status: 'down',
            },
          },
        }),
      );
    });
  });
});
