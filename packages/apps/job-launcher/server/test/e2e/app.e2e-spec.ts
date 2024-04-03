import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import setupE2eEnvironment from './env-setup';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    setupE2eEnvironment();
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(301)
      .expect('Moved Permanently. Redirecting to /swagger');
  });
});
