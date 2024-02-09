import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { generateWorkerSignupRequestBody } from './fixtures/user-worker.fixture';
import { SignupWorkerData } from '../src/modules/user-worker/interfaces/worker-registration.interface';
import { beforeAll } from '@jest/globals';
import { generateOperatorSignupRequestBody } from './fixtures/user-operator.fixture';
import { SignupOperatorData } from '../src/modules/user-operator/interfaces/operator-registration.interface';

describe('Human APP (e2e) tests', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Worker signup', () => {
    let requestBodyForWorkerSignup: SignupWorkerData;
    beforeAll(async () => {
      requestBodyForWorkerSignup = generateWorkerSignupRequestBody();
    });

    it('should successfully process the signup request for a worker', async () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(requestBodyForWorkerSignup)
        .expect(201);
    });

    it('should return a 409 Conflict status when processing a duplicate signup request for a worker', async () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(requestBodyForWorkerSignup)
        .expect(409);
    });
  });
  describe('Operator signup', () => {
    let requestBodyForOperatorSignup: SignupOperatorData;
    beforeAll(async () => {
      requestBodyForOperatorSignup = await generateOperatorSignupRequestBody();
      console.log('requestBodyForOperatorSignup', requestBodyForOperatorSignup);
    });
    it('should successfully process the signup request for an operator', async () => {
      return request(app.getHttpServer())
        .post('/auth/web3/signup')
        .send(requestBodyForOperatorSignup)
        .expect(201);
    });

    it('should return a 409 Conflict status when processing a duplicate signup request for an operator', async () => {
      return request(app.getHttpServer())
        .post('/auth/web3/signup')
        .send(requestBodyForOperatorSignup)
        .expect(409);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
