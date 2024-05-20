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
import {
  MOCK_BUCKET_FILES,
  MOCK_FILE_URL,
  MOCK_PRIVATE_KEY,
  MOCK_REQUESTER_DESCRIPTION,
  MOCK_WEB3_NODE_HOST,
  MOCK_WEB3_RPC_URL,
} from '../constants';
import { JobCaptchaShapeType, JobStatus } from '../../src/common/enums/job';
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
import { AWSRegions, StorageProviders } from '../../src/common/enums/storage';
import { ChainId } from '@human-protocol/sdk';
import { StorageService } from '../../src/modules/storage/storage.service';
import stringify from 'json-stable-stringify';
import { delay } from './utils';
import { PaymentService } from '../../src/modules/payment/payment.service';
import { NetworkConfigService } from '../../src/common/config/network-config.service';
import { Web3ConfigService } from '../../src/common/config/web3-config.service';

describe.skip('hCaptcha E2E workflow', () => {
  let app: INestApplication;
  let userRepository: UserRepository;
  let paymentRepository: PaymentRepository;
  let jobRepository: JobRepository;
  let userService: UserService;
  let storageService: StorageService;
  let paymentService: PaymentService;

  let userEntity: UserEntity;
  let accessToken: string;
  let paidAmount = 0;
  const initialBalance = 100;

  const email = `${crypto.randomBytes(16).toString('hex')}@hmt.ai`;
  const paymentIntentId = crypto.randomBytes(16).toString('hex');

  beforeAll(async () => {
    setupE2eEnvironment();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(NetworkConfigService)
      .useValue({
        networks: [
          {
            chainId: ChainId.LOCALHOST,
            rpcUrl: MOCK_WEB3_RPC_URL,
          },
        ],
      })
      .overrideProvider(Web3ConfigService)
      .useValue({
        privateKey: MOCK_PRIVATE_KEY,
        env: MOCK_WEB3_NODE_HOST,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<UserRepository>(UserRepository);
    paymentRepository = moduleFixture.get<PaymentRepository>(PaymentRepository);
    jobRepository = moduleFixture.get<JobRepository>(JobRepository);
    userService = moduleFixture.get<UserService>(UserService);
    storageService = moduleFixture.get<StorageService>(StorageService);
    paymentService = moduleFixture.get<PaymentService>(PaymentService);

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
      transaction: paymentIntentId,
      status: PaymentStatus.SUCCEEDED,
    });
    await paymentRepository.createUnique(newPaymentEntity);
  });

  afterEach(async () => {
    // Add a delay of 1 second between each test. Prevention: "429 Too Many Requests"
    await delay(1000);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create an hCaptcha job with comparison type successfully', async () => {
    const balance_before = await paymentService.getUserBalance(userEntity.id);
    expect(balance_before).toBe(initialBalance + paidAmount);

    const hCaptchaDto = {
      chain_id: ChainId.LOCALHOST,
      data: {
        provider: StorageProviders.LOCAL,
        region: AWSRegions.EU_CENTRAL_1,
        bucket_name: 'bucket',
        path: '',
      },
      accuracy_target: 0.9,
      completion_date: new Date(),
      min_requests: 1,
      max_requests: 10,
      annotations: {
        type_of_job: JobCaptchaShapeType.COMPARISON,
        labeling_prompt: MOCK_REQUESTER_DESCRIPTION,
        ground_truths: MOCK_FILE_URL,
        example_images: MOCK_BUCKET_FILES,
        task_bid_price: 0.5,
      },
      advanced: {},
    };

    const response = await request(app.getHttpServer())
      .post('/job/hCaptcha')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(hCaptchaDto)
      .expect(201);

    expect(response.text).toBeDefined();
    expect(typeof response.text).toBe('string');

    const jobEntity = await jobRepository.findOneByIdAndUserId(
      Number(response.text),
      userEntity.id,
    );

    expect(jobEntity).toBeDefined();
    expect(jobEntity!.status).toBe(JobStatus.PAID);
    expect(jobEntity!.manifestUrl).toBeDefined();

    const manifest = await storageService.download(jobEntity!.manifestUrl);

    expect(manifest).toBeDefined();

    const paymentEntities = await paymentRepository.findByUserAndStatus(
      userEntity.id,
      PaymentStatus.SUCCEEDED,
    );

    expect(paymentEntities[0]).toBeDefined();
    expect(paymentEntities[0].type).toBe(PaymentType.WITHDRAWAL);
    expect(paymentEntities[0].currency).toBe(TokenId.HMT);

    paidAmount += paymentEntities[0].rate * paymentEntities[0].amount;
    const balance_after = await paymentService.getUserBalance(userEntity.id);
    expect(balance_after).toBe(initialBalance + paidAmount);
  });

  it('should create an hCaptcha job with categorization type successfully', async () => {
    const balance_before = await paymentService.getUserBalance(userEntity.id);
    expect(balance_before).toBe(initialBalance + paidAmount);

    const groundTruthsData = {
      'image_name_1.jpg': [['Dog']],
      'image_name_2.jpg': [['Cat']],
    };

    const groundTruthsHash = crypto
      .createHash('sha1')
      .update(stringify(groundTruthsData))
      .digest('hex');

    const groundTruths = await storageService.uploadFile(
      groundTruthsData,
      groundTruthsHash,
    );

    const hCaptchaDto = {
      chain_id: ChainId.LOCALHOST,
      data: {
        provider: StorageProviders.LOCAL,
        region: AWSRegions.EU_CENTRAL_1,
        bucket_name: 'bucket',
        path: '',
      },
      accuracy_target: 0.9,
      completion_date: new Date(),
      min_requests: 1,
      max_requests: 10,
      annotations: {
        type_of_job: JobCaptchaShapeType.CATEGORIZATION,
        labeling_prompt: MOCK_REQUESTER_DESCRIPTION,
        ground_truths: groundTruths.url,
        example_images: MOCK_BUCKET_FILES,
        task_bid_price: 0.5,
      },
      advanced: {},
    };

    const response = await request(app.getHttpServer())
      .post('/job/hCaptcha')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(hCaptchaDto)
      .expect(201);

    expect(response.text).toBeDefined();
    expect(typeof response.text).toBe('string');

    const jobEntity = await jobRepository.findOneByIdAndUserId(
      Number(response.text),
      userEntity.id,
    );

    expect(jobEntity).toBeDefined();
    expect(jobEntity!.status).toBe(JobStatus.PAID);
    expect(jobEntity!.manifestUrl).toBeDefined();

    const manifest = await storageService.download(jobEntity!.manifestUrl);

    expect(jobEntity!.manifestUrl).toBeDefined();
    expect(manifest.requester_restricted_answer_set).toMatchObject({
      Dog: { answer_example_uri: 'image_name_1.jpg', en: 'Dog' },
      Cat: { answer_example_uri: 'image_name_2.jpg', en: 'Cat' },
    });

    const paymentEntities = await paymentRepository.findByUserAndStatus(
      userEntity.id,
      PaymentStatus.SUCCEEDED,
    );

    expect(paymentEntities[0]).toBeDefined();
    expect(paymentEntities[0].type).toBe(PaymentType.WITHDRAWAL);
    expect(paymentEntities[0].currency).toBe(TokenId.HMT);

    paidAmount += paymentEntities[0].rate * paymentEntities[0].amount;
    const balance_after = await paymentService.getUserBalance(userEntity.id);
    expect(balance_after).toBe(initialBalance + paidAmount);
  });

  it('should create an hCaptcha job with polygon type successfully', async () => {
    const balance_before = await paymentService.getUserBalance(userEntity.id);
    expect(balance_before).toBe(initialBalance + paidAmount);

    const hCaptchaDto = {
      chain_id: ChainId.LOCALHOST,
      data: {
        provider: StorageProviders.LOCAL,
        region: AWSRegions.EU_CENTRAL_1,
        bucket_name: 'bucket',
        path: '',
      },
      accuracy_target: 0.9,
      completion_date: new Date(),
      min_requests: 1,
      max_requests: 10,
      annotations: {
        type_of_job: JobCaptchaShapeType.POLYGON,
        label: 'Label',
        labeling_prompt: MOCK_REQUESTER_DESCRIPTION,
        ground_truths: MOCK_FILE_URL,
        example_images: MOCK_BUCKET_FILES,
        task_bid_price: 0.5,
      },
      advanced: {},
    };

    const response = await request(app.getHttpServer())
      .post('/job/hCaptcha')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(hCaptchaDto)
      .expect(201);

    expect(response.text).toBeDefined();
    expect(typeof response.text).toBe('string');

    const jobEntity = await jobRepository.findOneByIdAndUserId(
      Number(response.text),
      userEntity.id,
    );

    expect(jobEntity).toBeDefined();
    expect(jobEntity!.status).toBe(JobStatus.PAID);
    expect(jobEntity!.manifestUrl).toBeDefined();

    const manifest = await storageService.download(jobEntity!.manifestUrl);

    expect(jobEntity!.manifestUrl).toBeDefined();
    expect(manifest.requester_restricted_answer_set).toMatchObject({
      Label: { en: 'Label' },
    });

    const paymentEntities = await paymentRepository.findByUserAndStatus(
      userEntity.id,
      PaymentStatus.SUCCEEDED,
    );

    expect(paymentEntities[0]).toBeDefined();
    expect(paymentEntities[0].type).toBe(PaymentType.WITHDRAWAL);
    expect(paymentEntities[0].currency).toBe(TokenId.HMT);

    paidAmount += paymentEntities[0].rate * paymentEntities[0].amount;
    const balance_after = await paymentService.getUserBalance(userEntity.id);
    expect(balance_after).toBe(initialBalance + paidAmount);
  });

  it('should create an hCaptcha job with point type successfully', async () => {
    const balance_before = await paymentService.getUserBalance(userEntity.id);
    expect(balance_before).toBe(initialBalance + paidAmount);

    const hCaptchaDto = {
      chain_id: ChainId.LOCALHOST,
      data: {
        provider: StorageProviders.LOCAL,
        region: AWSRegions.EU_CENTRAL_1,
        bucket_name: 'bucket',
        path: '',
      },
      accuracy_target: 0.9,
      completion_date: new Date(),
      min_requests: 1,
      max_requests: 10,
      annotations: {
        type_of_job: JobCaptchaShapeType.POINT,
        label: 'Label',
        labeling_prompt: MOCK_REQUESTER_DESCRIPTION,
        ground_truths: MOCK_FILE_URL,
        example_images: MOCK_BUCKET_FILES,
        task_bid_price: 0.5,
      },
      advanced: {},
    };

    const response = await request(app.getHttpServer())
      .post('/job/hCaptcha')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(hCaptchaDto)
      .expect(201);

    expect(response.text).toBeDefined();
    expect(typeof response.text).toBe('string');

    const jobEntity = await jobRepository.findOneByIdAndUserId(
      Number(response.text),
      userEntity.id,
    );

    expect(jobEntity).toBeDefined();
    expect(jobEntity!.status).toBe(JobStatus.PAID);
    expect(jobEntity!.manifestUrl).toBeDefined();

    const manifest = await storageService.download(jobEntity!.manifestUrl);

    expect(jobEntity!.manifestUrl).toBeDefined();
    expect(manifest.requester_restricted_answer_set).toMatchObject({
      Label: { en: 'Label' },
    });

    const paymentEntities = await paymentRepository.findByUserAndStatus(
      userEntity.id,
      PaymentStatus.SUCCEEDED,
    );

    expect(paymentEntities[0]).toBeDefined();
    expect(paymentEntities[0].type).toBe(PaymentType.WITHDRAWAL);
    expect(paymentEntities[0].currency).toBe(TokenId.HMT);

    paidAmount += paymentEntities[0].rate * paymentEntities[0].amount;
    const balance_after = await paymentService.getUserBalance(userEntity.id);
    expect(balance_after).toBe(initialBalance + paidAmount);
  });

  it('should create an hCaptcha job with bounding box type successfully', async () => {
    const balance_before = await paymentService.getUserBalance(userEntity.id);
    expect(balance_before).toBe(initialBalance + paidAmount);

    const hCaptchaDto = {
      chain_id: ChainId.LOCALHOST,
      data: {
        provider: StorageProviders.LOCAL,
        region: AWSRegions.EU_CENTRAL_1,
        bucket_name: 'bucket',
        path: '',
      },
      accuracy_target: 0.9,
      completion_date: new Date(),
      min_requests: 1,
      max_requests: 10,
      annotations: {
        type_of_job: JobCaptchaShapeType.BOUNDING_BOX,
        label: 'Label',
        labeling_prompt: MOCK_REQUESTER_DESCRIPTION,
        ground_truths: MOCK_FILE_URL,
        example_images: MOCK_BUCKET_FILES,
        task_bid_price: 0.5,
      },
      advanced: {},
    };

    const response = await request(app.getHttpServer())
      .post('/job/hCaptcha')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(hCaptchaDto)
      .expect(201);

    expect(response.text).toBeDefined();
    expect(typeof response.text).toBe('string');

    const jobEntity = await jobRepository.findOneByIdAndUserId(
      Number(response.text),
      userEntity.id,
    );

    expect(jobEntity).toBeDefined();
    expect(jobEntity!.status).toBe(JobStatus.PAID);
    expect(jobEntity!.manifestUrl).toBeDefined();

    const manifest = await storageService.download(jobEntity!.manifestUrl);

    expect(jobEntity!.manifestUrl).toBeDefined();
    expect(manifest.requester_restricted_answer_set).toMatchObject({
      Label: { en: 'Label' },
    });

    const paymentEntities = await paymentRepository.findByUserAndStatus(
      userEntity.id,
      PaymentStatus.SUCCEEDED,
    );

    expect(paymentEntities[0]).toBeDefined();
    expect(paymentEntities[0].type).toBe(PaymentType.WITHDRAWAL);
    expect(paymentEntities[0].currency).toBe(TokenId.HMT);

    paidAmount += paymentEntities[0].rate * paymentEntities[0].amount;
    const balance_after = await paymentService.getUserBalance(userEntity.id);
    expect(balance_after).toBe(initialBalance + paidAmount);
  });

  it('should create an hCaptcha job with immo type successfully', async () => {
    const balance_before = await paymentService.getUserBalance(userEntity.id);
    expect(balance_before).toBe(initialBalance + paidAmount);

    const hCaptchaDto = {
      chain_id: ChainId.LOCALHOST,
      data: {
        provider: StorageProviders.LOCAL,
        region: AWSRegions.EU_CENTRAL_1,
        bucket_name: 'bucket',
        path: '',
      },
      accuracy_target: 0.9,
      completion_date: new Date(),
      min_requests: 1,
      max_requests: 10,
      annotations: {
        type_of_job: JobCaptchaShapeType.IMMO,
        label: 'Label',
        labeling_prompt: MOCK_REQUESTER_DESCRIPTION,
        ground_truths: MOCK_FILE_URL,
        example_images: MOCK_BUCKET_FILES,
        task_bid_price: 0.5,
      },
      advanced: {},
    };

    const response = await request(app.getHttpServer())
      .post('/job/hCaptcha')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(hCaptchaDto)
      .expect(201);

    expect(response.text).toBeDefined();
    expect(typeof response.text).toBe('string');

    const jobEntity = await jobRepository.findOneByIdAndUserId(
      Number(response.text),
      userEntity.id,
    );

    expect(jobEntity).toBeDefined();
    expect(jobEntity!.status).toBe(JobStatus.PAID);
    expect(jobEntity!.manifestUrl).toBeDefined();

    const manifest = await storageService.download(jobEntity!.manifestUrl);

    expect(jobEntity!.manifestUrl).toBeDefined();
    expect(manifest.requester_restricted_answer_set).toMatchObject({
      Label: { en: 'Label' },
    });

    const paymentEntities = await paymentRepository.findByUserAndStatus(
      userEntity.id,
      PaymentStatus.SUCCEEDED,
    );

    expect(paymentEntities[0]).toBeDefined();
    expect(paymentEntities[0].type).toBe(PaymentType.WITHDRAWAL);
    expect(paymentEntities[0].currency).toBe(TokenId.HMT);

    paidAmount += paymentEntities[0].rate * paymentEntities[0].amount;
    const balance_after = await paymentService.getUserBalance(userEntity.id);
    expect(balance_after).toBe(initialBalance + paidAmount);
  });

  it('should handle not enough funds error', async () => {
    const hCaptchaDto = {
      chain_id: ChainId.LOCALHOST,
      data: {
        provider: StorageProviders.LOCAL,
        region: AWSRegions.EU_CENTRAL_1,
        bucketName: 'bucket',
        path: '',
      },
      accuracyTarget: 0.9,
      minRequests: 1,
      maxRequests: 10,
      annotations: {
        typeOfJob: JobCaptchaShapeType.COMPARISON,
        labelingPrompt: MOCK_REQUESTER_DESCRIPTION,
        groundTruths: MOCK_FILE_URL,
        exampleImages: MOCK_BUCKET_FILES,
        taskBidPrice: 100,
      },
      completionDate: new Date(),
      advanced: {},
    };

    const invalidQuickLaunchResponse = await request(app.getHttpServer())
      .post('/job/hCaptcha')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(hCaptchaDto)
      .expect(400);

    expect(invalidQuickLaunchResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(invalidQuickLaunchResponse.body.message).toBe(
      ErrorJob.NotEnoughFunds,
    );
  });
});
