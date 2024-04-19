import request from 'supertest';
import * as crypto from 'crypto';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { UserRepository } from '../../src/modules/user/user.repository';
import { UserStatus } from '../../src/common/enums/user';
import { UserService } from '../../src/modules/user/user.service';
import { UserEntity } from '../../src/modules/user/user.entity';
import setupE2eEnvironment from './env-setup';
import {
  Currency,
  PaymentSource,
  PaymentStatus,
  PaymentType,
} from '../../src/common/enums/payment';
import { PaymentRepository } from '../../src/modules/payment/payment.repository';
import { JobRepository } from '../../src/modules/job/job.repository';

describe('Fiat account deposit E2E workflow', () => {
  let app: INestApplication;
  let userRepository: UserRepository;
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

    userRepository = moduleFixture.get<UserRepository>(UserRepository);
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a fiat payment successfully', async () => {
    const payemntFiatDto = {
      amount: 10,
      currency: Currency.USD,
    };

    const response = await request(app.getHttpServer())
      .post('/payment/fiat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payemntFiatDto)
      .expect(201);

    expect(response.text).toBeDefined();
    expect(typeof response.text).toBe('string');

    const paymentEntities = await paymentRepository.findByUserAndStatus(
      userEntity.id,
      PaymentStatus.PENDING,
    );

    expect(paymentEntities[0]).toBeDefined();
    expect(paymentEntities[0].type).toBe(PaymentType.DEPOSIT);
    expect(paymentEntities[0].source).toBe(PaymentSource.FIAT);
    expect(paymentEntities[0].currency).toBe(Currency.USD);
  });
});
