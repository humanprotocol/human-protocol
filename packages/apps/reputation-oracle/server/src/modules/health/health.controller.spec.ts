import { faker } from '@faker-js/faker';
import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  HealthIndicatorResult,
  HealthIndicatorStatus,
  TerminusModule,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { nestLoggerOverride } from '../../logger';
import { ServerConfigService } from '../../config/server-config.service';
import { HealthController } from './health.controller';

const mockServerConfigService = {
  gitHash: faker.git.commitSha(),
};

const mockTypeOrmPingCheck = jest.fn();

function generateMockHealthIndicatorResult(
  testKey: string,
  status: HealthIndicatorStatus,
): HealthIndicatorResult {
  return {
    [testKey]: {
      status,
    },
  };
}

describe('HealthController', () => {
  let healthController: HealthController;

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [
        {
          provide: ServerConfigService,
          useValue: mockServerConfigService,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: {
            pingCheck: mockTypeOrmPingCheck,
          },
        },
      ],
    });

    /**
     * Terminus uses nest logger internaly,
     * so override to omit logs in tests
     */
    moduleBuilder.setLogger(nestLoggerOverride);

    const moduleRef = await moduleBuilder.compile();

    healthController = moduleRef.get(HealthController);
  });

  it('/ping should return proper info', async () => {
    await expect(healthController.ping()).resolves.toEqual({
      appName: '@human-protocol/reputation-oracle',
      gitHash: mockServerConfigService.gitHash,
      nodeEnv: 'test',
    });
  });

  describe('/check', () => {
    const expectedDbTestKey = 'database';
    const expectedPingCheckOptions = {
      timeout: 5000,
    };

    afterEach(() => {
      mockTypeOrmPingCheck.mockReset();
    });

    it(`returns 'up' status when db is up`, async () => {
      const statusUp = 'up';
      mockTypeOrmPingCheck.mockResolvedValueOnce(
        generateMockHealthIndicatorResult(expectedDbTestKey, statusUp),
      );

      await expect(healthController.check()).resolves.toEqual(
        expect.objectContaining({
          status: 'ok',
          info: {
            [expectedDbTestKey]: {
              status: statusUp,
            },
          },
        }),
      );
      expect(mockTypeOrmPingCheck).toHaveBeenCalledTimes(1);
      expect(mockTypeOrmPingCheck).toHaveBeenCalledWith(
        expectedDbTestKey,
        expectedPingCheckOptions,
      );
    });

    it(`returns 'down' status when db is down`, async () => {
      const statusDown = 'down';

      mockTypeOrmPingCheck.mockResolvedValueOnce(
        generateMockHealthIndicatorResult(expectedDbTestKey, statusDown),
      );
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
            [expectedDbTestKey]: {
              status: statusDown,
            },
          },
        }),
      );
      expect(mockTypeOrmPingCheck).toHaveBeenCalledTimes(1);
      expect(mockTypeOrmPingCheck).toHaveBeenCalledWith(
        expectedDbTestKey,
        expectedPingCheckOptions,
      );
    });
  });
});
