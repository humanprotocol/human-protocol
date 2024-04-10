import request from 'supertest';
import * as crypto from 'crypto';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { UserStatus } from '../../src/common/enums/user';
import { UserService } from '../../src/modules/user/user.service';
import { UserEntity } from '../../src/modules/user/user.entity';
import setupE2eEnvironment from './env-setup';
import { JobStatus } from '../../src/common/enums/job';
import { ChainId } from '@human-protocol/sdk';
import { ErrorJob } from '../../src/common/constants/errors';
import {
  Currency,
  PaymentSource,
  PaymentStatus,
  PaymentType,
  TokenId,
} from '../../src/common/enums/payment';
import { PaymentEntity } from '../../src/modules/payment/payment.entity';
import { PaymentRepository } from '../../src/modules/payment/payment.repository';
import { JobRepository } from '../../src/modules/job/job.repository';

describe('Fortune E2E workflow', () => {
  let app: INestApplication;
  let paymentRepository: PaymentRepository;
  let jobRepository: JobRepository;
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

    paymentRepository = moduleFixture.get<PaymentRepository>(PaymentRepository);
    jobRepository = moduleFixture.get<JobRepository>(JobRepository);
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

  it('should create a Fortune job successfully', async () => {
    const createJobDto = {
      chain_id: ChainId.LOCALHOST,
      requester_title: 'Write an odd number',
      requester_description: 'Prime number',
      submissions_required: 10,
      fund_amount: 10, // HMT
    };

    const response = await request(app.getHttpServer())
      .post('/job/fortune')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createJobDto)
      .expect(201);

    expect(response.text).toBeDefined();
    expect(typeof response.text).toBe('string');

    const jobEntity = await jobRepository.findOneByIdAndUserId(
      Number(response.text),
      userEntity.id,
    );

    expect(jobEntity).toBeDefined();
    expect(jobEntity!.status).toBe(JobStatus.PAID);

    const paymentEntities = await paymentRepository.findByUserAndStatus(
      userEntity.id,
      PaymentStatus.SUCCEEDED,
    );

    expect(paymentEntities[0]).toBeDefined();
    expect(paymentEntities[0].type).toBe(PaymentType.WITHDRAWAL);
    expect(paymentEntities[0].currency).toBe(TokenId.HMT);
  });

  it('should handle not enough funds error', async () => {
    const createJobDto = {
      chain_id: ChainId.LOCALHOST,
      requester_title: 'Write an odd number',
      requester_description: 'Prime number',
      submissions_required: 10,
      fund_amount: 100000000, // HMT
    };

    const invalidQuickLaunchResponse = await request(app.getHttpServer())
      .post('/job/fortune')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createJobDto)
      .expect(400);

    expect(invalidQuickLaunchResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(invalidQuickLaunchResponse.body.message).toBe(
      ErrorJob.NotEnoughFunds,
    );
  });
});
