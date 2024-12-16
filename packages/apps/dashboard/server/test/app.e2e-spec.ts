import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { beforeAll, afterAll, describe, it, expect } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import {
  TestEnvironmentConfigService,
  testEnvValidator,
} from '../src/common/config/test-environment-config.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

describe('Dashboard (e2e) tests', () => {
  let app: INestApplication;
  let configService: ConfigService;
  let envConfigService: TestEnvironmentConfigService;
  let cacheManager: Cache;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configService = moduleFixture.get<ConfigService>(ConfigService);
    envConfigService = new TestEnvironmentConfigService(configService);
    cacheManager = app.get<Cache>(CACHE_MANAGER);

    const { error } = testEnvValidator.validate({
      E2E_TESTING_EMAIL_ADDRESS: envConfigService.e2eTestingEmailAddress,
    });

    if (error) {
      throw new Error(`Test environment is not valid: ${error.message}`);
    }

    await app.init();
  });

  describe('Networks API', () => {
    it('should successfully retrieve operating networks and validate chain IDs', async () => {
      const response = await request(app.getHttpServer())
        .get('/networks/operating')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((id: any) => typeof id === 'number')).toBe(
        true,
      );
    });

    it('should retrieve from cache when it exists', async () => {
      const mockData = [1, 2, 3];
      await cacheManager.set('operating-networks', mockData);

      const response = await request(app.getHttpServer())
        .get('/networks/operating')
        .expect(200);

      expect(response.body).toEqual(mockData);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
