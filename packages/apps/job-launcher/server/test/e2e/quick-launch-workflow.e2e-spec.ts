import request from 'supertest';
import * as crypto from 'crypto';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { UserRepository } from '../../src/modules/user/user.repository';
import { UserStatus } from '../../src/common/enums/user';
import { UserService } from '../../src/modules/user/user.service';
import { UserEntity } from '../../src/modules/user/user.entity';
import setupE2eEnvironment from './env-setup';
import { MOCK_FILE_HASH, MOCK_FILE_URL } from '../../test/constants';
import { JobRequestType } from '../../src/common/enums/job';
import { ChainId } from '@human-protocol/sdk';
import { ErrorJob } from '../../src/common/constants/errors';
import {
  Currency,
  PaymentSource,
  PaymentStatus,
  PaymentType,
} from '../../src/common/enums/payment';
import { PaymentEntity } from '../../src/modules/payment/payment.entity';
import { PaymentRepository } from '../../src/modules/payment/payment.repository';

describe('Quick launch E2E workflow', () => {
  let app: INestApplication;
  let userRepository: UserRepository;
  let paymentRepository: PaymentRepository;
  let userService: UserService;

  let userEntity: UserEntity;
  let accessToken: string;

  const email = `${crypto.randomBytes(16).toString('hex')}@hmt.ai`;

  beforeAll(async () => {
    setupE2eEnvironment();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<UserRepository>(UserRepository);
    paymentRepository = moduleFixture.get<PaymentRepository>(PaymentRepository);
    userService = moduleFixture.get<UserService>(UserService);

    userEntity = await userService.create({
      email,
      password: 'Password1!',
      hCaptchaToken: 'string',
    });

    userEntity.status = UserStatus.ACTIVE;
    await userEntity.save();

    const signInResponse = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email,
        password: 'Password1!',
        h_captcha_token: 'string',
      });

    accessToken = signInResponse.body.access_token;

    const newPaymentEntity = new PaymentEntity();
    Object.assign(newPaymentEntity, {
      userId: userEntity.id,
      source: PaymentSource.FIAT,
      type: PaymentType.DEPOSIT,
      amount: 100,
      currency: Currency.USD,
      rate: 1,
      transaction: 'payment_intent_id',
      status: PaymentStatus.SUCCEEDED,
    });
    await paymentRepository.createUnique(newPaymentEntity);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a job via quick launch successfully', async () => {
    const quickLaunchDto = {
      chain_id: ChainId.POLYGON_MUMBAI,
      request_type: JobRequestType.HCAPTCHA,
      manifest_url: MOCK_FILE_URL,
      manifest_hash: MOCK_FILE_HASH,
      fund_amount: 10,
    };

    const response = await request(app.getHttpServer())
      .post('/job/quick-launch')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(quickLaunchDto)
      .expect(201);

    expect(response.text).toBeDefined();
    expect(typeof response.text).toBe('string');
  });

  it('should handle not enough funds error', async () => {
    const quickLaunchData = {
      chain_id: ChainId.POLYGON_MUMBAI,
      request_type: JobRequestType.HCAPTCHA,
      manifest_url: MOCK_FILE_URL,
      manifest_hash: MOCK_FILE_HASH,
      fund_amount: 100000000,
    };

    const invalidQuickLaunchResponse = await request(app.getHttpServer())
      .post('/job/quick-launch')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(quickLaunchData)
      .expect(400);

    expect(invalidQuickLaunchResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(invalidQuickLaunchResponse.body.message).toBe(
      ErrorJob.NotEnoughFunds,
    );
  });

  it('should handle manifest hash does not exist error', async () => {
    const quickLaunchData = {
      chain_id: ChainId.POLYGON_MUMBAI,
      request_type: JobRequestType.HCAPTCHA,
      manifest_url: 'http://example.com',
      fund_amount: 10,
    };

    const invalidQuickLaunchResponse = await request(app.getHttpServer())
      .post('/job/quick-launch')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(quickLaunchData)
      .expect(409);

    expect(invalidQuickLaunchResponse.status).toBe(HttpStatus.CONFLICT);
    expect(invalidQuickLaunchResponse.body.message).toBe(
      ErrorJob.ManifestHashNotExist,
    );
  });
});
