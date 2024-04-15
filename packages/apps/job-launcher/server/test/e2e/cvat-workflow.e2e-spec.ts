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
  MOCK_CVAT_DATA,
  MOCK_CVAT_DATA_DATASET,
  MOCK_CVAT_GT,
  MOCK_CVAT_LABELS,
  MOCK_FILE_URL,
  MOCK_REQUESTER_DESCRIPTION,
  MOCK_STORAGE_DATA,
} from '../constants';
import {
  JobCaptchaShapeType,
  JobRequestType,
  JobStatus,
} from '../../src/common/enums/job';
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
import { delay, getFileNameFromURL } from './utils';

describe('CVAT E2E workflow', () => {
  let app: INestApplication;
  let userRepository: UserRepository;
  let paymentRepository: PaymentRepository;
  let jobRepository: JobRepository;
  let userService: UserService;
  let storageService: StorageService;

  let userEntity: UserEntity;
  let accessToken: string;

  const email = `${crypto.randomBytes(16).toString('hex')}@hmt.ai`;
  const paymentIntentId = crypto.randomBytes(16).toString('hex');

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
    storageService = moduleFixture.get<StorageService>(StorageService);

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

  it('should create an CVAT job with image boxes type successfully', async () => {
    const groundTruthsData = MOCK_CVAT_GT;

    const groundTruthsHash = crypto
      .createHash('sha1')
      .update(stringify(groundTruthsData))
      .digest('hex');

    const groundTruths = await storageService.uploadFile(
      groundTruthsData,
      groundTruthsHash,
    );

    const cvatDto = {
      chain_id: ChainId.LOCALHOST,
      data: {
        dataset: {
          provider: StorageProviders.LOCAL,
          region: AWSRegions.EU_CENTRAL_1,
          bucket_name: 'bucket',
          path: '',
        },
      },
      labels: MOCK_CVAT_LABELS,
      requester_description: MOCK_REQUESTER_DESCRIPTION,
      user_guide: MOCK_FILE_URL,
      min_quality: 0.8,
      ground_truth: {
        provider: StorageProviders.LOCAL,
        region: AWSRegions.EU_CENTRAL_1,
        bucket_name: 'bucket',
        path: getFileNameFromURL(groundTruths.url),
      },
      type: JobRequestType.IMAGE_BOXES,
      fund_amount: 10,
    };

    const response = await request(app.getHttpServer())
      .post('/job/cvat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(cvatDto)
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

    expect(manifest.job_bounty).toBeDefined();

    const paymentEntities = await paymentRepository.findByUserAndStatus(
      userEntity.id,
      PaymentStatus.SUCCEEDED,
    );

    expect(paymentEntities[0]).toBeDefined();
    expect(paymentEntities[0].type).toBe(PaymentType.WITHDRAWAL);
    expect(paymentEntities[0].currency).toBe(TokenId.HMT);
  });

  it('should create an CVAT job with image points type successfully', async () => {
    const groundTruthsData = MOCK_CVAT_GT;

    const groundTruthsHash = crypto
      .createHash('sha1')
      .update(stringify(groundTruthsData))
      .digest('hex');

    const groundTruths = await storageService.uploadFile(
      groundTruthsData,
      groundTruthsHash,
    );

    const cvatDto = {
      chain_id: ChainId.LOCALHOST,
      data: {
        dataset: {
          provider: StorageProviders.LOCAL,
          region: AWSRegions.EU_CENTRAL_1,
          bucket_name: 'bucket',
          path: '',
        },
      },
      labels: MOCK_CVAT_LABELS,
      requester_description: MOCK_REQUESTER_DESCRIPTION,
      user_guide: MOCK_FILE_URL,
      min_quality: 0.8,
      ground_truth: {
        provider: StorageProviders.LOCAL,
        region: AWSRegions.EU_CENTRAL_1,
        bucket_name: 'bucket',
        path: getFileNameFromURL(groundTruths.url),
      },
      type: JobRequestType.IMAGE_POINTS,
      fund_amount: 10,
    };

    const response = await request(app.getHttpServer())
      .post('/job/cvat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(cvatDto)
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

    expect(manifest.job_bounty).toBeDefined();

    const paymentEntities = await paymentRepository.findByUserAndStatus(
      userEntity.id,
      PaymentStatus.SUCCEEDED,
    );

    expect(paymentEntities[0]).toBeDefined();
    expect(paymentEntities[0].type).toBe(PaymentType.WITHDRAWAL);
    expect(paymentEntities[0].currency).toBe(TokenId.HMT);
  });

  it('should create an CVAT job with image boxes from points type successfully', async () => {
    const datasetData = MOCK_CVAT_DATA;

    const datasetHash = crypto
      .createHash('sha1')
      .update(stringify(datasetData))
      .digest('hex');

    const dataset = await storageService.uploadFile(datasetData, datasetHash);

    const groundTruthsData = MOCK_CVAT_GT;

    const groundTruthsHash = crypto
      .createHash('sha1')
      .update(stringify(groundTruthsData))
      .digest('hex');

    const groundTruths = await storageService.uploadFile(
      groundTruthsData,
      groundTruthsHash,
    );

    const cvatDto = {
      chain_id: ChainId.LOCALHOST,
      data: {
        dataset: {
          provider: StorageProviders.LOCAL,
          region: AWSRegions.EU_CENTRAL_1,
          bucket_name: 'bucket',
          path: '',
        },
        points: {
          provider: StorageProviders.LOCAL,
          region: AWSRegions.EU_CENTRAL_1,
          bucket_name: 'bucket',
          path: getFileNameFromURL(dataset.url),
        },
      },
      labels: MOCK_CVAT_LABELS,
      requester_description: MOCK_REQUESTER_DESCRIPTION,
      user_guide: MOCK_FILE_URL,
      min_quality: 0.8,
      ground_truth: {
        provider: StorageProviders.LOCAL,
        region: AWSRegions.EU_CENTRAL_1,
        bucket_name: 'bucket',
        path: getFileNameFromURL(groundTruths.url),
      },
      type: JobRequestType.IMAGE_BOXES_FROM_POINTS,
      fund_amount: 10,
    };

    const response = await request(app.getHttpServer())
      .post('/job/cvat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(cvatDto)
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

    expect(manifest.job_bounty).toBeDefined();

    const paymentEntities = await paymentRepository.findByUserAndStatus(
      userEntity.id,
      PaymentStatus.SUCCEEDED,
    );

    expect(paymentEntities[0]).toBeDefined();
    expect(paymentEntities[0].type).toBe(PaymentType.WITHDRAWAL);
    expect(paymentEntities[0].currency).toBe(TokenId.HMT);
  });

  it('should handle when data does not exist while creating a CVAT job with image boxes from points type', async () => {
    const groundTruthsData = MOCK_CVAT_GT;

    const groundTruthsHash = crypto
      .createHash('sha1')
      .update(stringify(groundTruthsData))
      .digest('hex');

    const groundTruths = await storageService.uploadFile(
      groundTruthsData,
      groundTruthsHash,
    );

    const cvatDto = {
      chain_id: ChainId.LOCALHOST,
      data: {
        dataset: {
          provider: StorageProviders.LOCAL,
          region: AWSRegions.EU_CENTRAL_1,
          bucket_name: 'bucket',
          path: '',
        },
      },
      labels: MOCK_CVAT_LABELS,
      requester_description: MOCK_REQUESTER_DESCRIPTION,
      user_guide: MOCK_FILE_URL,
      min_quality: 0.8,
      ground_truth: {
        provider: StorageProviders.LOCAL,
        region: AWSRegions.EU_CENTRAL_1,
        bucket_name: 'bucket',
        path: getFileNameFromURL(groundTruths.url),
      },
      type: JobRequestType.IMAGE_BOXES_FROM_POINTS,
      fund_amount: 10,
    };

    const invalidCreateJobResponse = await request(app.getHttpServer())
      .post('/job/cvat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(cvatDto)
      .expect(409);

    expect(invalidCreateJobResponse.status).toBe(HttpStatus.CONFLICT);
    expect(invalidCreateJobResponse.body.message).toBe(ErrorJob.DataNotExist);
  });

  it('should create an CVAT job with image skeletons from boxes type successfully', async () => {
    const datasetData = MOCK_CVAT_DATA;

    const datasetHash = crypto
      .createHash('sha1')
      .update(stringify(datasetData))
      .digest('hex');

    const dataset = await storageService.uploadFile(datasetData, datasetHash);

    const groundTruthsData = MOCK_CVAT_GT;

    const groundTruthsHash = crypto
      .createHash('sha1')
      .update(stringify(groundTruthsData))
      .digest('hex');

    const groundTruths = await storageService.uploadFile(
      groundTruthsData,
      groundTruthsHash,
    );

    const cvatDto = {
      chain_id: ChainId.LOCALHOST,
      data: {
        dataset: {
          provider: StorageProviders.LOCAL,
          region: AWSRegions.EU_CENTRAL_1,
          bucket_name: 'bucket',
          path: '',
        },
        boxes: {
          provider: StorageProviders.LOCAL,
          region: AWSRegions.EU_CENTRAL_1,
          bucket_name: 'bucket',
          path: getFileNameFromURL(dataset.url),
        },
      },
      labels: MOCK_CVAT_LABELS,
      requester_description: MOCK_REQUESTER_DESCRIPTION,
      user_guide: MOCK_FILE_URL,
      min_quality: 0.8,
      ground_truth: {
        provider: StorageProviders.LOCAL,
        region: AWSRegions.EU_CENTRAL_1,
        bucket_name: 'bucket',
        path: getFileNameFromURL(groundTruths.url),
      },
      type: JobRequestType.IMAGE_SKELETONS_FROM_BOXES,
      fund_amount: 10,
    };

    const response = await request(app.getHttpServer())
      .post('/job/cvat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(cvatDto)
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

    expect(manifest.job_bounty).toBeDefined();

    const paymentEntities = await paymentRepository.findByUserAndStatus(
      userEntity.id,
      PaymentStatus.SUCCEEDED,
    );

    expect(paymentEntities[0]).toBeDefined();
    expect(paymentEntities[0].type).toBe(PaymentType.WITHDRAWAL);
    expect(paymentEntities[0].currency).toBe(TokenId.HMT);
  });

  it('should handle when data does not exist while creating a CVAT job with image skeletons from boxes type', async () => {
    const groundTruthsData = MOCK_CVAT_GT;

    const groundTruthsHash = crypto
      .createHash('sha1')
      .update(stringify(groundTruthsData))
      .digest('hex');

    const groundTruths = await storageService.uploadFile(
      groundTruthsData,
      groundTruthsHash,
    );

    const cvatDto = {
      chain_id: ChainId.LOCALHOST,
      data: {
        dataset: {
          provider: StorageProviders.LOCAL,
          region: AWSRegions.EU_CENTRAL_1,
          bucket_name: 'bucket',
          path: '',
        },
      },
      labels: MOCK_CVAT_LABELS,
      requester_description: MOCK_REQUESTER_DESCRIPTION,
      user_guide: MOCK_FILE_URL,
      min_quality: 0.8,
      ground_truth: {
        provider: StorageProviders.LOCAL,
        region: AWSRegions.EU_CENTRAL_1,
        bucket_name: 'bucket',
        path: getFileNameFromURL(groundTruths.url),
      },
      type: JobRequestType.IMAGE_BOXES_FROM_POINTS,
      fund_amount: 10,
    };

    const invalidCreateJobResponse = await request(app.getHttpServer())
      .post('/job/cvat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(cvatDto)
      .expect(409);

    expect(invalidCreateJobResponse.status).toBe(HttpStatus.CONFLICT);
    expect(invalidCreateJobResponse.body.message).toBe(ErrorJob.DataNotExist);
  });

  it('should handle not enough funds error', async () => {
    const cvatDto = {
      chain_id: ChainId.LOCALHOST,
      data: {
        dataset: {
          provider: StorageProviders.LOCAL,
          region: AWSRegions.EU_CENTRAL_1,
          bucket_name: 'bucket',
          path: '',
        },
      },
      labels: MOCK_CVAT_LABELS,
      requester_description: MOCK_REQUESTER_DESCRIPTION,
      user_guide: MOCK_FILE_URL,
      min_quality: 0.8,
      ground_truth: {
        provider: StorageProviders.LOCAL,
        region: AWSRegions.EU_CENTRAL_1,
        bucket_name: 'bucket',
        path: MOCK_FILE_URL,
      },
      type: JobRequestType.IMAGE_BOXES,
      fund_amount: 100000000,
    };

    const invalidCreateJobResponse = await request(app.getHttpServer())
      .post('/job/cvat')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(cvatDto)
      .expect(400);

    expect(invalidCreateJobResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(invalidCreateJobResponse.body.message).toBe(ErrorJob.NotEnoughFunds);
  });
});
