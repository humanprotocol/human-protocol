import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { generateWorkerSignupRequestBody } from './fixtures/user-worker.fixture';
import { SignupWorkerData } from '../src/modules/user-worker/model/worker-registration.model';
import { beforeAll } from '@jest/globals';
import { generateOperatorSignupRequestBody } from './fixtures/user-operator.fixture';
import { SignupOperatorData } from '../src/modules/user-operator/model/operator.model';
import { ConfigService } from '@nestjs/config';
import {
  TestEnvironmentConfigService,
  testEnvValidator,
} from '../src/common/config/test-environment-config.service';

describe('Human APP (e2e) tests', () => {
  let app: INestApplication;
  let configService: ConfigService;
  let envConfigService: TestEnvironmentConfigService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configService = moduleFixture.get<ConfigService>(ConfigService);
    envConfigService = new TestEnvironmentConfigService(configService);

    const { error } = testEnvValidator.validate({
      E2E_TESTING_EMAIL_ADDRESS: envConfigService.e2eTestingEmailAddress,
      E2E_TESTING_PASSWORD: envConfigService.e2eTestingPassword,
      E2E_TESTING_EXCHANGE_ORACLE_URL:
        envConfigService.e2eTestingExchangeOracleUrl,
      E2E_TESTING_ESCROW_ADDRESS: envConfigService.e2eTestingEscrowAddress,
      E2E_TESTING_ESCROW_CHAIN_ID: envConfigService.e2eTestingEscrowChainId,
    });

    if (error) {
      throw new Error(`Test environment is not valid: ${error.message}`);
    }

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
  describe('Worker signin', () => {
    it('should successfully process the signin request for a worker', async () => {
      return request(app.getHttpServer())
        .post('/auth/signin')
        .send({
          email: envConfigService.e2eTestingEmailAddress,
          password: envConfigService.e2eTestingPassword,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('refresh_token');
        });
    });
  });
  describe('Jobs discovery', () => {
    it('should successfully process the jobs discovery request', async () => {
      const exchangeOracleUrl = envConfigService.e2eTestingExchangeOracleUrl;
      return request(app.getHttpServer())
        .get(`${exchangeOracleUrl}/jobs`)
        .expect(200);
    });
  });
  describe('Job assignment', () => {
    it('should successfully assign a job to a user', async () => {
      const exchangeOracleUrl = envConfigService.e2eTestingExchangeOracleUrl;
      return request(app.getHttpServer())
        .post(`${exchangeOracleUrl}/assignment`)
        .send({
          escrow_address: envConfigService.e2eTestingEscrowAddress,
          chain_id: envConfigService.e2eTestingEscrowChainId,
        })
        .expect(201);
    });
    it('should successfully get jobs assigned to a user', async () => {
      const exchangeOracleUrl = envConfigService.e2eTestingExchangeOracleUrl;
      return request(app.getHttpServer())
        .get(`${exchangeOracleUrl}/assignment`)
        .query({})
        .expect(200);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
