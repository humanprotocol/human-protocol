/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createMock } from '@golevelup/ts-jest';
import {
  ChainId,
  EscrowClient,
  EscrowStatus,
  StakingClient,
  IAllocation,
  EscrowUtils,
  NETWORKS,
  KVStoreClient,
} from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  ErrorBucket,
  ErrorJob,
  ErrorWeb3,
} from '../../common/constants/errors';
import {
  PaymentSource,
  PaymentStatus,
  PaymentType,
  TokenId,
} from '../../common/enums/payment';
import {
  JobCaptchaMode,
  JobCaptchaRequestType,
  JobCaptchaShapeType,
  JobRequestType,
  JobStatus,
  JobStatusFilter,
  WorkerBrowser,
  WorkerLanguage,
  WorkerLocation,
} from '../../common/enums/job';
import {
  MOCK_ADDRESS,
  MOCK_BUCKET_FILES,
  MOCK_BUCKET_NAME,
  MOCK_CHAIN_ID,
  MOCK_EXCHANGE_ORACLE_ADDRESS,
  MOCK_ORACLE_FEE,
  MOCK_EXCHANGE_ORACLE_WEBHOOK_URL,
  MOCK_FILE_HASH,
  MOCK_FILE_URL,
  MOCK_HCAPTCHA_ORACLE_ADDRESS,
  MOCK_HCAPTCHA_PGP_PUBLIC_KEY,
  MOCK_JOB_ID,
  MOCK_JOB_LAUNCHER_FEE,
  MOCK_PGP_PRIVATE_KEY,
  MOCK_PGP_PUBLIC_KEY,
  MOCK_MANIFEST,
  MOCK_PRIVATE_KEY,
  MOCK_RECORDING_ORACLE_ADDRESS,
  MOCK_REPUTATION_ORACLE_ADDRESS,
  MOCK_REQUESTER_DESCRIPTION,
  MOCK_REQUESTER_TITLE,
  MOCK_SUBMISSION_REQUIRED,
  MOCK_TRANSACTION_HASH,
  MOCK_USER_ID,
  MOCK_STORAGE_DATA,
  MOCK_CVAT_JOB_SIZE,
  MOCK_CVAT_MAX_TIME,
  MOCK_CVAT_VAL_SIZE,
  MOCK_HCAPTCHA_SITE_KEY,
  MOCK_HCAPTCHA_IMAGE_LABEL,
  MOCK_HCAPTCHA_IMAGE_URL,
  MOCK_HCAPTCHA_REPO_URI,
  MOCK_HCAPTCHA_RO_URI,
  MOCK_FILE_KEY,
  MOCK_BUCKET_FILE,
} from '../../../test/constants';
import { PaymentService } from '../payment/payment.service';
import { Web3Service } from '../web3/web3.service';
import {
  FortuneFinalResultDto,
  FortuneManifestDto,
  JobFortuneDto,
  JobCvatDto,
  JobDetailsDto,
  StorageDataDto,
  JobCaptchaDto,
  CvatManifestDto,
} from './job.dto';
import { JobEntity } from './job.entity';
import { JobRepository } from './job.repository';
import { JobService } from './job.service';

import { div, mul } from '../../common/utils/decimal';
import { PaymentRepository } from '../payment/payment.repository';
import { RoutingProtocolService } from './routing-protocol.service';
import { EventType } from '../../common/enums/webhook';
import { PaymentEntity } from '../payment/payment.entity';
import { BigNumber, ethers } from 'ethers';
import { HMToken__factory } from '@human-protocol/core/typechain-types';
import { StorageService } from '../storage/storage.service';
import {
  HCAPTCHA_MAX_SHAPES_PER_IMAGE,
  HCAPTCHA_MINIMUM_SELECTION_AREA_PER_SHAPE,
  HCAPTCHA_MIN_SHAPES_PER_IMAGE,
  HCAPTCHA_NOT_PRESENTED_LABEL,
} from '../../common/constants';
import { WebhookService } from '../webhook/webhook.service';
import { CronJobService } from '../cron-job/cron-job.service';
import { CronJobEntity } from '../cron-job/cron-job.entity';
import { CronJobType } from '../../common/enums/cron-job';
import { DeepPartial } from 'typeorm';
import { AWSRegions, StorageProviders } from '../../common/enums/storage';

const rate = 1.5;
jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn().mockImplementation(() => ({
      createEscrow: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      setup: jest.fn().mockResolvedValue(null),
      fund: jest.fn().mockResolvedValue(null),
    })),
  },
  EscrowUtils: {
    getEscrows: jest.fn(),
    getEscrow: jest.fn(),
  },
  StakingClient: {
    build: jest.fn().mockImplementation(() => ({
      getAllocation: jest.fn(),
    })),
  },
  StorageClient: jest.fn().mockImplementation(() => ({
    uploadFiles: jest
      .fn()
      .mockResolvedValue([
        { key: MOCK_FILE_KEY, url: MOCK_FILE_URL, hash: MOCK_FILE_HASH },
      ]),
    listObjects: jest.fn().mockResolvedValue(MOCK_BUCKET_FILES),
  })),
  KVStoreClient: {
    build: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
    })),
  },
}));

jest.mock('../../common/utils', () => ({
  ...jest.requireActual('../../common/utils'),
  getRate: jest.fn().mockImplementation(() => rate),
  parseUrl: jest.fn().mockImplementation(() => {
    return {
      useSSL: false,
      host: '127.0.0.1',
      port: 9000,
      bucket: MOCK_BUCKET_NAME,
    };
  }),
}));

jest.mock('../../common/utils/storage', () => ({
  ...jest.requireActual('../../common/utils/storage'),
  listObjectsInBucket: jest.fn().mockImplementation(() => MOCK_BUCKET_FILES),
}));

describe('JobService', () => {
  let jobService: JobService,
    jobRepository: JobRepository,
    paymentRepository: PaymentRepository,
    paymentService: PaymentService,
    createPaymentMock: any,
    routingProtocolService: RoutingProtocolService,
    web3Service: Web3Service,
    storageService: StorageService,
    webhookService: WebhookService,
    cronJobService: CronJobService;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  beforeEach(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'JOB_LAUNCHER_FEE':
            return MOCK_JOB_LAUNCHER_FEE;
          case 'WEB3_JOB_LAUNCHER_PRIVATE_KEY':
            return MOCK_PRIVATE_KEY;
          case 'FORTUNE_EXCHANGE_ORACLE_ADDRESS':
            return MOCK_EXCHANGE_ORACLE_ADDRESS;
          case 'FORTUNE_RECORDING_ORACLE_ADDRESS':
            return MOCK_RECORDING_ORACLE_ADDRESS;
          case 'CVAT_EXCHANGE_ORACLE_ADDRESS':
            return MOCK_EXCHANGE_ORACLE_ADDRESS;
          case 'CVAT_RECORDING_ORACLE_ADDRESS':
            return MOCK_RECORDING_ORACLE_ADDRESS;
          case 'REPUTATION_ORACLE_ADDRESS':
            return MOCK_REPUTATION_ORACLE_ADDRESS;
          case 'FORTUNE_EXCHANGE_ORACLE_WEBHOOK_URL':
            return MOCK_EXCHANGE_ORACLE_WEBHOOK_URL;
          case 'CVAT_EXCHANGE_ORACLE_WEBHOOK_URL':
            return MOCK_EXCHANGE_ORACLE_WEBHOOK_URL;
          case 'HOST':
            return '127.0.0.1';
          case 'PORT':
            return 5000;
          case 'WEB3_PRIVATE_KEY':
            return MOCK_PRIVATE_KEY;
          case 'S3_BUCKET':
            return MOCK_BUCKET_NAME;
          case 'CVAT_JOB_SIZE':
            return 1;
          case 'PGP_PRIVATE_KEY':
            return MOCK_PGP_PRIVATE_KEY;
          case 'PGP_PUBLIC_KEY':
            return MOCK_PGP_PUBLIC_KEY;
          case 'HCAPTCHA_PGP_PUBLIC_KEY':
            return MOCK_HCAPTCHA_PGP_PUBLIC_KEY;
          case 'HCAPTCHA_ORACLE_ADDRESS':
            return MOCK_HCAPTCHA_ORACLE_ADDRESS;
          case 'HCAPTCHA_SITE_KEY':
            return MOCK_HCAPTCHA_SITE_KEY;
          case 'CVAT_JOB_SIZE':
            return MOCK_CVAT_JOB_SIZE;
          case 'CVAT_MAX_TIME':
            return MOCK_CVAT_MAX_TIME;
          case 'CVAT_VAL_SIZE':
            return MOCK_CVAT_VAL_SIZE;
          case 'HCAPTCHA_REPUTATION_ORACLE_URI':
            return MOCK_HCAPTCHA_REPO_URI;
          case 'HCAPTCHA_RECORDING_ORACLE_URI':
            return MOCK_HCAPTCHA_RO_URI;
        }
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        JobService,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
            validateChainId: jest.fn().mockReturnValue(new Error()),
          },
        },
        { provide: JobRepository, useValue: createMock<JobRepository>() },
        {
          provide: PaymentRepository,
          useValue: createMock<PaymentRepository>(),
        },
        { provide: PaymentService, useValue: createMock<PaymentService>() },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: createMock<HttpService>() },
        { provide: StorageService, useValue: createMock<StorageService>() },
        { provide: WebhookService, useValue: createMock<WebhookService>() },
        {
          provide: RoutingProtocolService,
          useValue: createMock<RoutingProtocolService>(),
        },
        {
          provide: CronJobService,
          useValue: createMock<CronJobService>(),
        },
      ],
    }).compile();

    jobService = moduleRef.get<JobService>(JobService);
    jobRepository = moduleRef.get(JobRepository);
    paymentRepository = moduleRef.get(PaymentRepository);
    paymentService = moduleRef.get(PaymentService);
    routingProtocolService = moduleRef.get(RoutingProtocolService);
    createPaymentMock = jest.spyOn(paymentRepository, 'create');
    web3Service = moduleRef.get<Web3Service>(Web3Service);
    storageService = moduleRef.get<StorageService>(StorageService);
    webhookService = moduleRef.get<WebhookService>(WebhookService);
    cronJobService = moduleRef.get<CronJobService>(CronJobService);

    storageService.uploadFile = jest.fn().mockResolvedValue({
      url: MOCK_FILE_URL,
      hash: MOCK_FILE_HASH,
    });

    storageService.download = jest.fn();

    web3Service.calculateGasPrice = jest
      .fn()
      .mockReturnValue(BigNumber.from(1000));
  });

  describe('createJob', () => {
    const userId = 1;
    const jobId = 123;
    const fortuneJobDto: JobFortuneDto = {
      chainId: MOCK_CHAIN_ID,
      submissionsRequired: MOCK_SUBMISSION_REQUIRED,
      requesterTitle: MOCK_REQUESTER_TITLE,
      requesterDescription: MOCK_REQUESTER_DESCRIPTION,
      fundAmount: 10,
    };

    let getUserBalanceMock: any;

    beforeEach(() => {
      getUserBalanceMock = jest.spyOn(paymentService, 'getUserBalance');
      createPaymentMock.mockResolvedValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create a job successfully', async () => {
      const fundAmount = 10;
      const fee = (MOCK_JOB_LAUNCHER_FEE / 100) * fundAmount;

      const userBalance = 25;
      getUserBalanceMock.mockResolvedValue(userBalance);

      const mockJobEntity: Partial<JobEntity> = {
        id: jobId,
        userId: userId,
        chainId: ChainId.LOCALHOST,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        fee,
        fundAmount,
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      (KVStoreClient.build as any).mockImplementation(() => ({
        get: jest.fn().mockResolvedValue(MOCK_ORACLE_FEE),
      }));

      jobRepository.create = jest.fn().mockResolvedValue(mockJobEntity);

      await jobService.createJob(userId, JobRequestType.FORTUNE, fortuneJobDto);

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(userId);
      expect(paymentRepository.create).toHaveBeenCalledWith({
        userId,
        jobId,
        source: PaymentSource.BALANCE,
        type: PaymentType.WITHDRAWAL,
        currency: TokenId.HMT,
        amount: -mul(fundAmount + fee, rate),
        rate: div(1, rate),
        status: PaymentStatus.SUCCEEDED,
      });
      expect(jobRepository.create).toHaveBeenCalledWith({
        chainId: fortuneJobDto.chainId,
        userId,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        fee: mul(fee, rate),
        fundAmount: mul(fundAmount, rate),
        status: JobStatus.PENDING,
        waitUntil: expect.any(Date),
      });
    });

    it('should create a fortune job successfully on network selected from round robin logic', async () => {
      const fundAmount = 10;
      const fee = (MOCK_JOB_LAUNCHER_FEE / 100) * fundAmount;

      const userBalance = 25;
      getUserBalanceMock.mockResolvedValue(userBalance);

      jest
        .spyOn(routingProtocolService, 'selectNetwork')
        .mockReturnValue(ChainId.MOONBEAM);

      await jobService.createJob(userId, JobRequestType.FORTUNE, {
        ...fortuneJobDto,
        chainId: undefined,
      });

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(userId);
      expect(jobRepository.create).toHaveBeenCalledWith({
        chainId: ChainId.MOONBEAM,
        userId,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        fee: mul(fee, rate),
        fundAmount: mul(fundAmount, rate),
        status: JobStatus.PENDING,
        waitUntil: expect.any(Date),
      });
    });

    it('should throw an exception for invalid chain id provided', async () => {
      web3Service.validateChainId = jest.fn(() => {
        throw new Error(ErrorWeb3.InvalidTestnetChainId);
      });

      await expect(
        jobService.createJob(userId, JobRequestType.FORTUNE, fortuneJobDto),
      ).rejects.toThrowError(ErrorWeb3.InvalidTestnetChainId);
    });

    it('should throw an exception for insufficient user balance', async () => {
      const userBalance = 1;
      jest
        .spyOn(paymentService, 'getUserBalance')
        .mockResolvedValue(userBalance);

      getUserBalanceMock.mockResolvedValue(userBalance);

      await expect(
        jobService.createJob(userId, JobRequestType.FORTUNE, fortuneJobDto),
      ).rejects.toThrowError(ErrorJob.NotEnoughFunds);
    });

    it('should throw an exception if job entity creation fails', async () => {
      const userBalance = 25;

      getUserBalanceMock.mockResolvedValue(userBalance);

      jest.spyOn(jobRepository, 'create').mockResolvedValue(undefined!);

      await expect(
        jobService.createJob(userId, JobRequestType.FORTUNE, fortuneJobDto),
      ).rejects.toThrowError(ErrorJob.NotCreated);
    });
  });

  describe('createCvatManifest', () => {
    it('should create a valid CVAT manifest', async () => {
      const jobBounty = '50';
      jest
        .spyOn(jobService, 'calculateJobBounty')
        .mockResolvedValueOnce(jobBounty);

      const dto: JobCvatDto = {
        data: MOCK_STORAGE_DATA,
        labels: ['label1', 'label2'],
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        userGuide: MOCK_FILE_URL,
        minQuality: 0.8,
        groundTruth: MOCK_STORAGE_DATA,
        type: JobRequestType.IMAGE_BOXES,
        fundAmount: 10,
      };

      const requestType = JobRequestType.IMAGE_BOXES;
      const tokenFundAmount = 100;

      const result = await jobService.createCvatManifest(
        dto,
        requestType,
        tokenFundAmount,
      );

      expect(result).toEqual({
        data: {
          data_url: MOCK_BUCKET_FILE,
        },
        annotation: {
          labels: [{ name: 'label1' }, { name: 'label2' }],
          description: MOCK_REQUESTER_DESCRIPTION,
          user_guide: MOCK_FILE_URL,
          type: requestType,
          job_size: 1,
          max_time: 300,
        },
        validation: {
          min_quality: 0.8,
          val_size: 2,
          gt_url: MOCK_BUCKET_FILE,
        },
        job_bounty: jobBounty,
      });
    });
  });

  describe('createHCaptchaManifest', () => {
    beforeEach(() => {
      jest
        .spyOn(jobService, 'generateAndUploadTaskData')
        .mockResolvedValueOnce(MOCK_FILE_URL);
    });

    it('should create a valid HCaptcha manifest for COMPARISON job type', async () => {
      const fileContent = JSON.stringify({
        [MOCK_HCAPTCHA_IMAGE_URL]: [true, true, true],
      });
      jest.spyOn(storageService, 'download').mockResolvedValueOnce(fileContent);

      const jobType = JobCaptchaShapeType.COMPARISON;
      const jobDto: JobCaptchaDto = {
        data: MOCK_STORAGE_DATA,
        accuracyTarget: 0.9,
        minRequests: 1,
        maxRequests: 10,
        annotations: {
          typeOfJob: jobType,
          labelingPrompt: MOCK_REQUESTER_DESCRIPTION,
          groundTruths: MOCK_FILE_URL,
          exampleImages: MOCK_BUCKET_FILES,
          taskBidPrice: 0.5,
        },
        completionDate: new Date(),
        advanced: {},
      };

      const result = await jobService.createHCaptchaManifest(jobType, jobDto);

      expect(result).toEqual({
        job_mode: JobCaptchaMode.BATCH,
        requester_accuracy_target: 0.9,
        request_config: {},
        restricted_audience: {
          sitekey: [
            {
              [MOCK_HCAPTCHA_SITE_KEY]: {
                score: 1,
              },
            },
          ],
        },
        requester_max_repeats: 10,
        requester_min_repeats: 1,
        requester_question: { en: MOCK_REQUESTER_DESCRIPTION },
        job_total_tasks: 6,
        task_bid_price: 0.5,
        taskdata_uri: MOCK_FILE_URL,
        public_results: true,
        oracle_stake: 0.05,
        repo_uri: MOCK_HCAPTCHA_REPO_URI,
        ro_uri: MOCK_HCAPTCHA_RO_URI,
        request_type: JobCaptchaRequestType.IMAGE_LABEL_BINARY,
        groundtruth_uri: MOCK_FILE_URL,
        requester_restricted_answer_set: {},
        requester_question_example: MOCK_BUCKET_FILES,
      });
    });

    it('should create a valid HCaptcha manifest for CATEGORIZATION job type', async () => {
      const fileContent = JSON.stringify({
        [MOCK_HCAPTCHA_IMAGE_URL]: [[MOCK_HCAPTCHA_IMAGE_LABEL]],
      });
      jest.spyOn(storageService, 'download').mockResolvedValueOnce(fileContent);

      const jobType = JobCaptchaShapeType.CATEGORIZATION;
      const jobDto: JobCaptchaDto = {
        data: MOCK_STORAGE_DATA,
        accuracyTarget: 0.9,
        minRequests: 1,
        maxRequests: 10,
        annotations: {
          typeOfJob: jobType,
          labelingPrompt: MOCK_REQUESTER_DESCRIPTION,
          groundTruths: MOCK_FILE_URL,
          exampleImages: MOCK_BUCKET_FILES,
          taskBidPrice: 0.5,
        },
        completionDate: new Date(),
        advanced: {},
      };

      const result = await jobService.createHCaptchaManifest(jobType, jobDto);

      expect(result).toEqual({
        job_mode: JobCaptchaMode.BATCH,
        requester_accuracy_target: 0.9,
        request_config: {},
        restricted_audience: {
          sitekey: [
            {
              [MOCK_HCAPTCHA_SITE_KEY]: {
                score: 1,
              },
            },
          ],
        },
        requester_max_repeats: 10,
        requester_min_repeats: 1,
        requester_question: { en: MOCK_REQUESTER_DESCRIPTION },
        job_total_tasks: 6, // Mocked length
        task_bid_price: 0.5,
        taskdata_uri: MOCK_FILE_URL,
        public_results: true,
        oracle_stake: 0.05,
        repo_uri: MOCK_HCAPTCHA_REPO_URI,
        ro_uri: MOCK_HCAPTCHA_RO_URI,
        request_type: JobCaptchaRequestType.IMAGE_LABEL_MULTIPLE_CHOICE,
        groundtruth_uri: MOCK_FILE_URL,
        requester_restricted_answer_set: {
          '0': {
            en: HCAPTCHA_NOT_PRESENTED_LABEL,
          },
          [MOCK_HCAPTCHA_IMAGE_LABEL]: {
            answer_example_uri: MOCK_HCAPTCHA_IMAGE_URL,
            en: MOCK_HCAPTCHA_IMAGE_LABEL,
          },
        },
      });
    });

    it('should create a valid HCaptcha manifest for POLYGON job type', async () => {
      const fileContent = JSON.stringify({
        [MOCK_HCAPTCHA_IMAGE_URL]: [
          [
            {
              entity_type: 'number',
              entity_coords: [
                97, 89, 105, 89, 105, 118, 112, 118, 112, 123, 89, 123, 89, 118,
                97, 118, 97, 95, 89, 100, 89, 94,
              ],
              entity_name: 0,
            },
          ],
        ],
      });
      jest.spyOn(storageService, 'download').mockResolvedValueOnce(fileContent);

      const jobType = JobCaptchaShapeType.POLYGON;
      const jobDto: JobCaptchaDto = {
        data: MOCK_STORAGE_DATA,
        accuracyTarget: 0.9,
        minRequests: 1,
        maxRequests: 10,
        annotations: {
          typeOfJob: jobType,
          labelingPrompt: MOCK_REQUESTER_DESCRIPTION,
          groundTruths: MOCK_FILE_URL,
          exampleImages: MOCK_BUCKET_FILES,
          taskBidPrice: 0.5,
          label: MOCK_HCAPTCHA_IMAGE_LABEL,
        },
        completionDate: new Date(),
        advanced: {},
      };

      const result = await jobService.createHCaptchaManifest(jobType, jobDto);

      expect(result).toEqual({
        job_mode: JobCaptchaMode.BATCH,
        requester_accuracy_target: 0.9,
        request_config: {
          shape_type: jobType,
          min_shapes_per_image: HCAPTCHA_MIN_SHAPES_PER_IMAGE,
          max_shapes_per_image: HCAPTCHA_MAX_SHAPES_PER_IMAGE,
          min_points: 4,
          max_points: 4,
          minimum_selection_area_per_shape:
            HCAPTCHA_MINIMUM_SELECTION_AREA_PER_SHAPE,
        },
        restricted_audience: {
          sitekey: [
            {
              [MOCK_HCAPTCHA_SITE_KEY]: {
                score: 1,
              },
            },
          ],
        },
        requester_max_repeats: 10,
        requester_min_repeats: 1,
        requester_question: { en: MOCK_REQUESTER_DESCRIPTION },
        job_total_tasks: 6, // Mocked length
        task_bid_price: 0.5,
        taskdata_uri: MOCK_FILE_URL,
        public_results: true,
        oracle_stake: 0.05,
        repo_uri: MOCK_HCAPTCHA_REPO_URI,
        ro_uri: MOCK_HCAPTCHA_RO_URI,
        request_type: JobCaptchaRequestType.IMAGE_LABEL_AREA_SELECT,
        groundtruth_uri: MOCK_FILE_URL,
        requester_restricted_answer_set: {
          [MOCK_HCAPTCHA_IMAGE_LABEL]: { en: MOCK_HCAPTCHA_IMAGE_LABEL },
        },
        requester_question_example: MOCK_BUCKET_FILES,
      });
    });

    it('should create a valid HCaptcha manifest for POINT job type', async () => {
      const fileContent = JSON.stringify({
        [MOCK_HCAPTCHA_IMAGE_URL]: [
          [
            {
              entity_type: 'number',
              entity_coords: [124, 89],
              entity_name: 0,
            },
          ],
        ],
      });
      jest.spyOn(storageService, 'download').mockResolvedValueOnce(fileContent);

      const jobType = JobCaptchaShapeType.POINT;
      const jobDto: JobCaptchaDto = {
        data: MOCK_STORAGE_DATA,
        accuracyTarget: 0.9,
        minRequests: 1,
        maxRequests: 10,
        annotations: {
          typeOfJob: jobType,
          labelingPrompt: MOCK_REQUESTER_DESCRIPTION,
          groundTruths: MOCK_FILE_URL,
          exampleImages: MOCK_BUCKET_FILES,
          taskBidPrice: 0.5,
          label: MOCK_HCAPTCHA_IMAGE_LABEL,
        },
        completionDate: new Date(),
        advanced: {},
      };

      const result = await jobService.createHCaptchaManifest(jobType, jobDto);

      expect(result).toEqual({
        job_mode: JobCaptchaMode.BATCH,
        requester_accuracy_target: 0.9,
        request_config: {
          shape_type: JobCaptchaShapeType.POINT,
          min_shapes_per_image: HCAPTCHA_MIN_SHAPES_PER_IMAGE,
          max_shapes_per_image: HCAPTCHA_MAX_SHAPES_PER_IMAGE,
          min_points: 1,
          max_points: 8,
        },
        restricted_audience: {
          sitekey: [
            {
              [MOCK_HCAPTCHA_SITE_KEY]: {
                score: 1,
              },
            },
          ],
        },
        requester_max_repeats: 10,
        requester_min_repeats: 1,
        requester_question: { en: MOCK_REQUESTER_DESCRIPTION },
        job_total_tasks: 6, // Mocked length
        task_bid_price: 0.5,
        taskdata_uri: MOCK_FILE_URL,
        public_results: true,
        oracle_stake: 0.05,
        repo_uri: MOCK_HCAPTCHA_REPO_URI,
        ro_uri: MOCK_HCAPTCHA_RO_URI,
        request_type: JobCaptchaRequestType.IMAGE_LABEL_AREA_SELECT,
        groundtruth_uri: MOCK_FILE_URL,
        requester_restricted_answer_set: {
          [MOCK_HCAPTCHA_IMAGE_LABEL]: { en: MOCK_HCAPTCHA_IMAGE_LABEL },
        },
        requester_question_example: MOCK_BUCKET_FILES,
      });
    });

    it('should create a valid HCaptcha manifest for BOUNDING_BOX job type', async () => {
      const fileContent = JSON.stringify({
        [MOCK_HCAPTCHA_IMAGE_URL]: [
          [
            {
              entity_type: 'number',
              entity_coords: [74, 88, 126, 88, 126, 123, 74, 123],
              entity_name: 0,
            },
          ],
        ],
      });
      jest.spyOn(storageService, 'download').mockResolvedValueOnce(fileContent);

      const jobType = JobCaptchaShapeType.BOUNDING_BOX;
      const jobDto: JobCaptchaDto = {
        data: MOCK_STORAGE_DATA,
        accuracyTarget: 0.9,
        minRequests: 1,
        maxRequests: 10,
        annotations: {
          typeOfJob: jobType,
          labelingPrompt: MOCK_REQUESTER_DESCRIPTION,
          groundTruths: MOCK_FILE_URL,
          exampleImages: MOCK_BUCKET_FILES,
          taskBidPrice: 0.5,
          label: MOCK_HCAPTCHA_IMAGE_LABEL,
        },
        completionDate: new Date(),
        advanced: {},
      };

      const result = await jobService.createHCaptchaManifest(jobType, jobDto);

      expect(result).toEqual({
        job_mode: JobCaptchaMode.BATCH,
        requester_accuracy_target: 0.9,
        request_config: {
          shape_type: JobCaptchaShapeType.BOUNDING_BOX,
          min_shapes_per_image: HCAPTCHA_MIN_SHAPES_PER_IMAGE,
          max_shapes_per_image: HCAPTCHA_MAX_SHAPES_PER_IMAGE,
          min_points: 4,
          max_points: 4,
        },
        restricted_audience: {
          sitekey: [
            {
              [MOCK_HCAPTCHA_SITE_KEY]: {
                score: 1,
              },
            },
          ],
        },
        requester_max_repeats: 10,
        requester_min_repeats: 1,
        requester_question: { en: MOCK_REQUESTER_DESCRIPTION },
        job_total_tasks: 6, // Mocked length
        task_bid_price: 0.5,
        taskdata_uri: MOCK_FILE_URL,
        public_results: true,
        oracle_stake: 0.05,
        repo_uri: MOCK_HCAPTCHA_REPO_URI,
        ro_uri: MOCK_HCAPTCHA_RO_URI,
        request_type: JobCaptchaRequestType.IMAGE_LABEL_AREA_SELECT,
        groundtruth_uri: MOCK_FILE_URL,
        requester_restricted_answer_set: {
          [MOCK_HCAPTCHA_IMAGE_LABEL]: { en: MOCK_HCAPTCHA_IMAGE_LABEL },
        },
        requester_question_example: MOCK_BUCKET_FILES,
      });
    });

    it('should throw BadRequestException for invalid POLYGON job type without label', async () => {
      const fileContent = JSON.stringify({
        [MOCK_HCAPTCHA_IMAGE_URL]: [[MOCK_HCAPTCHA_IMAGE_LABEL]],
      });
      jest.spyOn(storageService, 'download').mockResolvedValueOnce(fileContent);

      const jobType = JobCaptchaShapeType.POLYGON;
      const jobDto: JobCaptchaDto = {
        data: MOCK_STORAGE_DATA,
        accuracyTarget: 0.9,
        minRequests: 1,
        maxRequests: 10,
        annotations: {
          typeOfJob: jobType,
          labelingPrompt: MOCK_REQUESTER_DESCRIPTION,
          groundTruths: MOCK_FILE_URL,
          exampleImages: MOCK_BUCKET_FILES,
          taskBidPrice: 0.5,
        },
        completionDate: new Date(),
        advanced: {},
      };

      await expect(
        jobService.createHCaptchaManifest(jobType, jobDto),
      ).rejects.toThrowError(BadRequestException);
    });
  });

  describe('calculateJobBounty', () => {
    it('should calculate the job bounty correctly', async () => {
      const tokenFundAmount = 0.013997056833333334;
      const result = await jobService['calculateJobBounty'](6, tokenFundAmount);

      expect(result).toEqual('0.002332842805555555');
    });
  });

  describe('createJob with image label binary type', () => {
    const userId = 1;
    const jobId = 123;

    const imageLabelBinaryJobDto: JobCvatDto = {
      chainId: MOCK_CHAIN_ID,
      data: MOCK_STORAGE_DATA,
      labels: ['cat', 'dog'],
      requesterDescription: MOCK_REQUESTER_DESCRIPTION,
      minQuality: 0.95,
      fundAmount: 10,
      groundTruth: MOCK_STORAGE_DATA,
      userGuide: MOCK_FILE_URL,
      type: JobRequestType.IMAGE_POINTS,
    };

    let getUserBalanceMock: any;

    beforeEach(() => {
      getUserBalanceMock = jest.spyOn(paymentService, 'getUserBalance');
      createPaymentMock.mockResolvedValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create a job successfully', async () => {
      const fundAmount = 10;
      const fee = (MOCK_JOB_LAUNCHER_FEE / 100) * fundAmount;

      const userBalance = 25;
      getUserBalanceMock.mockResolvedValue(userBalance);

      const mockJobEntity: Partial<JobEntity> = {
        id: jobId,
        userId: userId,
        chainId: ChainId.LOCALHOST,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        fee,
        fundAmount,
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      jobRepository.create = jest.fn().mockResolvedValue(mockJobEntity);

      await jobService.createJob(
        userId,
        JobRequestType.IMAGE_POINTS,
        imageLabelBinaryJobDto,
      );

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(userId);
      expect(paymentRepository.create).toHaveBeenCalledWith({
        userId,
        jobId,
        source: PaymentSource.BALANCE,
        type: PaymentType.WITHDRAWAL,
        currency: TokenId.HMT,
        amount: -mul(fundAmount + fee, rate),
        rate: div(1, rate),
        status: PaymentStatus.SUCCEEDED,
      });
      expect(jobRepository.create).toHaveBeenCalledWith({
        chainId: imageLabelBinaryJobDto.chainId,
        userId,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        fee: mul(fee, rate),
        fundAmount: mul(fundAmount, rate),
        status: JobStatus.PENDING,
        waitUntil: expect.any(Date),
      });
    });

    it('should throw an error for invalid storage provider', async () => {
      const userBalance = 25;
      getUserBalanceMock.mockResolvedValue(userBalance);

      const storageDataMock: StorageDataDto = {
        provider: StorageProviders.GCS,
        region: AWSRegions.EU_CENTRAL_1,
        bucketName: 'bucket',
        path: 'folder/test',
      };

      const imageLabelBinaryJobDto: JobCvatDto = {
        chainId: MOCK_CHAIN_ID,
        data: storageDataMock,
        labels: ['cat', 'dog'],
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        minQuality: 0.95,
        fundAmount: 10,
        groundTruth: storageDataMock,
        userGuide: MOCK_FILE_URL,
        type: JobRequestType.IMAGE_POINTS,
      };

      await expect(
        jobService.createJob(
          userId,
          JobRequestType.IMAGE_POINTS,
          imageLabelBinaryJobDto,
        ),
      ).rejects.toThrowError(ErrorBucket.InvalidProvider);

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(userId);
    });

    it('should throw an error for invalid region', async () => {
      const userBalance = 25;
      getUserBalanceMock.mockResolvedValue(userBalance);

      const storageDataMock: any = {
        provider: StorageProviders.AWS,
        region: 'test-region',
        bucketName: 'bucket',
        path: 'folder/test',
      };

      const imageLabelBinaryJobDto: JobCvatDto = {
        chainId: MOCK_CHAIN_ID,
        data: storageDataMock,
        labels: ['cat', 'dog'],
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        minQuality: 0.95,
        fundAmount: 10,
        groundTruth: storageDataMock,
        userGuide: MOCK_FILE_URL,
        type: JobRequestType.IMAGE_POINTS,
      };

      await expect(
        jobService.createJob(
          userId,
          JobRequestType.IMAGE_POINTS,
          imageLabelBinaryJobDto,
        ),
      ).rejects.toThrowError(ErrorBucket.InvalidRegion);

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(userId);
    });

    it('should throw an error for empty region', async () => {
      const userBalance = 25;
      getUserBalanceMock.mockResolvedValue(userBalance);

      const storageDataMock: any = {
        provider: StorageProviders.AWS,
        bucketName: 'bucket',
        path: 'folder/test',
      };

      const imageLabelBinaryJobDto: JobCvatDto = {
        chainId: MOCK_CHAIN_ID,
        data: storageDataMock,
        labels: ['cat', 'dog'],
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        minQuality: 0.95,
        fundAmount: 10,
        groundTruth: storageDataMock,
        userGuide: MOCK_FILE_URL,
        type: JobRequestType.IMAGE_POINTS,
      };

      await expect(
        jobService.createJob(
          userId,
          JobRequestType.IMAGE_POINTS,
          imageLabelBinaryJobDto,
        ),
      ).rejects.toThrowError(ErrorBucket.EmptyRegion);

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(userId);
    });

    it('should throw an error for empty bucket', async () => {
      const userBalance = 25;
      getUserBalanceMock.mockResolvedValue(userBalance);

      const storageDataMock: any = {
        provider: StorageProviders.AWS,
        region: AWSRegions.EU_CENTRAL_1,
        path: 'folder/test',
      };

      const imageLabelBinaryJobDto: JobCvatDto = {
        chainId: MOCK_CHAIN_ID,
        data: storageDataMock,
        labels: ['cat', 'dog'],
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        minQuality: 0.95,
        fundAmount: 10,
        groundTruth: storageDataMock,
        userGuide: MOCK_FILE_URL,
        type: JobRequestType.IMAGE_POINTS,
      };

      await expect(
        jobService.createJob(
          userId,
          JobRequestType.IMAGE_POINTS,
          imageLabelBinaryJobDto,
        ),
      ).rejects.toThrowError(ErrorBucket.EmptyBucket);

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(userId);
    });

    it('should create a fortune job successfully on network selected from round robin logic', async () => {
      const fundAmount = imageLabelBinaryJobDto.fundAmount;
      const fee = (MOCK_JOB_LAUNCHER_FEE / 100) * fundAmount;

      const userBalance = 25;
      getUserBalanceMock.mockResolvedValue(userBalance);

      jest
        .spyOn(routingProtocolService, 'selectNetwork')
        .mockReturnValue(ChainId.MOONBEAM);

      await jobService.createJob(userId, JobRequestType.IMAGE_POINTS, {
        ...imageLabelBinaryJobDto,
        chainId: undefined,
      });

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(userId);
      expect(jobRepository.create).toHaveBeenCalledWith({
        chainId: ChainId.MOONBEAM,
        userId,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        fee: mul(fee, rate),
        fundAmount: mul(fundAmount, rate),
        status: JobStatus.PENDING,
        waitUntil: expect.any(Date),
      });
    });

    it('should throw an exception for invalid chain id provided', async () => {
      web3Service.validateChainId = jest.fn(() => {
        throw new Error(ErrorWeb3.InvalidTestnetChainId);
      });

      await expect(
        jobService.createJob(
          userId,
          JobRequestType.IMAGE_POINTS,
          imageLabelBinaryJobDto,
        ),
      ).rejects.toThrowError(ErrorWeb3.InvalidTestnetChainId);
    });

    it('should throw an exception for insufficient user balance', async () => {
      const userBalance = 1;

      jest
        .spyOn(paymentService, 'getUserBalance')
        .mockResolvedValue(userBalance);

      getUserBalanceMock.mockResolvedValue(userBalance);

      await expect(
        jobService.createJob(
          userId,
          JobRequestType.IMAGE_POINTS,
          imageLabelBinaryJobDto,
        ),
      ).rejects.toThrowError(ErrorJob.NotEnoughFunds);
    });

    it('should throw an exception if job entity creation fails', async () => {
      const userBalance = 100;

      getUserBalanceMock.mockResolvedValue(userBalance);

      jest.spyOn(jobRepository, 'create').mockResolvedValue(undefined!);

      await expect(
        jobService.createJob(
          userId,
          JobRequestType.IMAGE_POINTS,
          imageLabelBinaryJobDto,
        ),
      ).rejects.toThrowError(ErrorJob.NotCreated);
    });
  });

  describe('createJob with hCaptcha type', () => {
    const userId = 1;
    const jobId = 123;

    const hCaptchaJobDto: JobCaptchaDto = {
      data: MOCK_STORAGE_DATA,
      accuracyTarget: 0.9,
      completionDate: new Date(),
      minRequests: 1,
      maxRequests: 4,
      advanced: {
        workerLanguage: WorkerLanguage.EN,
        workerLocation: WorkerLocation.FR,
        targetBrowser: WorkerBrowser.DESKTOP,
      },
      annotations: {
        typeOfJob: JobCaptchaShapeType.COMPARISON,
        taskBidPrice: 1,
        labelingPrompt: 'Test description',
        groundTruths: MOCK_FILE_URL,
        exampleImages: [MOCK_FILE_URL],
      },
    };

    let getUserBalanceMock: any;

    beforeEach(() => {
      getUserBalanceMock = jest.spyOn(paymentService, 'getUserBalance');
      createPaymentMock.mockResolvedValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create a job successfully', async () => {
      const fundAmount = div(
        hCaptchaJobDto.annotations.taskBidPrice * MOCK_BUCKET_FILES.length,
        rate,
      );
      const fee = (MOCK_JOB_LAUNCHER_FEE / 100) * fundAmount;
      const userBalance = 25;
      getUserBalanceMock.mockResolvedValue(userBalance);

      const mockJobEntity: Partial<JobEntity> = {
        id: jobId,
        userId: userId,
        chainId: ChainId.LOCALHOST,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        fee,
        fundAmount,
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      jobRepository.create = jest.fn().mockResolvedValue(mockJobEntity);

      await jobService.createJob(
        userId,
        JobRequestType.HCAPTCHA,
        hCaptchaJobDto,
      );

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(userId);
      expect(paymentRepository.create).toHaveBeenCalledWith({
        userId,
        jobId,
        source: PaymentSource.BALANCE,
        type: PaymentType.WITHDRAWAL,
        currency: TokenId.HMT,
        amount: -mul(fundAmount + fee, rate),
        rate: div(1, rate),
        status: PaymentStatus.SUCCEEDED,
      });
      expect(jobRepository.create).toHaveBeenCalledWith({
        chainId: hCaptchaJobDto.chainId,
        userId,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        fee: Number(mul(fee, rate).toFixed(3)),
        fundAmount: mul(fundAmount, rate),
        status: JobStatus.PENDING,
        waitUntil: expect.any(Date),
      });
    });

    it('should create a job successfully on network selected from round robin logic', async () => {
      const fundAmount = div(
        hCaptchaJobDto.annotations.taskBidPrice * MOCK_BUCKET_FILES.length,
        rate,
      );
      const fee = (MOCK_JOB_LAUNCHER_FEE / 100) * fundAmount;

      const userBalance = 25;
      getUserBalanceMock.mockResolvedValue(userBalance);

      jest
        .spyOn(routingProtocolService, 'selectNetwork')
        .mockReturnValue(ChainId.MOONBEAM);

      await jobService.createJob(userId, JobRequestType.HCAPTCHA, {
        ...hCaptchaJobDto,
        chainId: undefined,
      });

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(userId);
      expect(jobRepository.create).toHaveBeenCalledWith({
        chainId: ChainId.MOONBEAM,
        userId,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        fee: mul(fee, rate),
        fundAmount: mul(fundAmount, rate),
        status: JobStatus.PENDING,
        waitUntil: expect.any(Date),
      });
    });

    it('should throw an exception for insufficient user balance', async () => {
      const userBalance = 1;

      jest
        .spyOn(paymentService, 'getUserBalance')
        .mockResolvedValue(userBalance);

      getUserBalanceMock.mockResolvedValue(userBalance);

      await expect(
        jobService.createJob(userId, JobRequestType.HCAPTCHA, hCaptchaJobDto),
      ).rejects.toThrowError(ErrorJob.NotEnoughFunds);
    });

    it('should throw an exception if job entity creation fails', async () => {
      const userBalance = 100;

      getUserBalanceMock.mockResolvedValue(userBalance);

      jest.spyOn(jobRepository, 'create').mockResolvedValue(undefined!);

      await expect(
        jobService.createJob(userId, JobRequestType.HCAPTCHA, hCaptchaJobDto),
      ).rejects.toThrowError(ErrorJob.NotCreated);
    });
  });

  describe('createEscrow', () => {
    const chainId = ChainId.LOCALHOST;

    it('should create an escrow successfully', async () => {
      const fundAmount = 10;
      const fee = (MOCK_JOB_LAUNCHER_FEE / 100) * fundAmount;

      const mockJobEntity: Partial<JobEntity> = {
        chainId,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        fee,
        fundAmount,
        status: JobStatus.PAID,
        save: jest.fn().mockResolvedValue(true),
        userId: 1,
      };

      const jobEntityResult = await jobService.createEscrow(
        mockJobEntity as JobEntity,
      );

      mockJobEntity.status = JobStatus.CREATED;
      mockJobEntity.escrowAddress = MOCK_ADDRESS;
      expect(jobEntityResult).toMatchObject(mockJobEntity);
      expect(mockJobEntity.save).toHaveBeenCalled();
    });

    it('should handle error during job creation', async () => {
      (EscrowClient.build as any).mockImplementationOnce(() => ({
        createEscrow: jest.fn().mockRejectedValue(new Error()),
      }));

      const mockJobEntity: Partial<JobEntity> = {
        chainId: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        status: JobStatus.PAID,
        save: jest.fn().mockResolvedValue(true),
      };

      await expect(
        jobService.createEscrow(mockJobEntity as JobEntity),
      ).rejects.toThrow();
    });
  });

  describe('setupEscrow', () => {
    const chainId = ChainId.LOCALHOST;

    it('should setup escrow and update the status to funding', async () => {
      const fundAmount = 10;
      const fee = (MOCK_JOB_LAUNCHER_FEE / 100) * fundAmount;

      const mockJobEntity: Partial<JobEntity> = {
        chainId,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        fee,
        fundAmount,
        status: JobStatus.CREATED,
        save: jest.fn().mockResolvedValue(true),
        userId: 1,
      };

      const manifest: FortuneManifestDto = {
        submissionsRequired: 10,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount,
        requestType: JobRequestType.FORTUNE,
      };

      storageService.download = jest.fn().mockReturnValue(manifest);

      const jobEntityResult = await jobService.setupEscrow(
        mockJobEntity as JobEntity,
      );

      mockJobEntity.status = JobStatus.SET_UP;
      expect(mockJobEntity.save).toHaveBeenCalled();
      expect(jobEntityResult).toMatchObject(mockJobEntity);
    });

    it('should validate manifest before setup', async () => {
      const fundAmount = 10;
      const fee = (MOCK_JOB_LAUNCHER_FEE / 100) * fundAmount;

      const mockJobEntity: Partial<JobEntity> = {
        chainId,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        fee,
        fundAmount,
        status: JobStatus.CREATED,
        save: jest.fn().mockResolvedValue(true),
        userId: 1,
      };

      const manifest: Partial<FortuneManifestDto> = {
        submissionsRequired: 10,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        requestType: JobRequestType.FORTUNE,
      };

      storageService.download = jest.fn().mockReturnValue(manifest);

      await expect(
        jobService.setupEscrow(mockJobEntity as JobEntity),
      ).rejects.toThrow();
    });

    it('should handle error during job setup', async () => {
      (EscrowClient.build as any).mockImplementationOnce(() => ({
        setup: jest.fn().mockRejectedValue(new Error()),
      }));

      const mockJobEntity: Partial<JobEntity> = {
        chainId: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        status: JobStatus.CREATED,
        save: jest.fn().mockResolvedValue(true),
      };

      const fundAmount = 10;
      const manifest: FortuneManifestDto = {
        submissionsRequired: 10,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount,
        requestType: JobRequestType.FORTUNE,
      };

      storageService.download = jest.fn().mockReturnValue(manifest);

      await expect(
        jobService.setupEscrow(mockJobEntity as JobEntity),
      ).rejects.toThrow();
    });
  });

  describe('fundEscrow', () => {
    const chainId = ChainId.LOCALHOST;

    it('should fund escrow and update the status to launched', async () => {
      const fundAmount = 10;
      const fee = (MOCK_JOB_LAUNCHER_FEE / 100) * fundAmount;

      const mockJobEntity: Partial<JobEntity> = {
        chainId,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        fee,
        fundAmount,
        status: JobStatus.SET_UP,
        save: jest.fn().mockResolvedValue(true),
        userId: 1,
      };

      const jobEntityResult = await jobService.fundEscrow(
        mockJobEntity as JobEntity,
      );

      mockJobEntity.status = JobStatus.LAUNCHED;
      expect(mockJobEntity.save).toHaveBeenCalled();
      expect(jobEntityResult).toMatchObject(mockJobEntity);
    });

    it('should handle error during job fund', async () => {
      (EscrowClient.build as any).mockImplementationOnce(() => ({
        fund: jest.fn().mockRejectedValue(new Error()),
      }));

      const mockJobEntity: Partial<JobEntity> = {
        chainId: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        status: JobStatus.SET_UP,
        save: jest.fn().mockResolvedValue(true),
      };

      await expect(
        jobService.fundEscrow(mockJobEntity as JobEntity),
      ).rejects.toThrow();
    });
  });

  describe('requestToCancelJob', () => {
    const jobId = 1;
    const userId = 123;

    it('should cancel the job when status is Launched', async () => {
      const escrowAddress = MOCK_ADDRESS;
      const mockJobEntity: Partial<JobEntity> = {
        id: jobId,
        userId,
        status: JobStatus.LAUNCHED,
        escrowAddress,
        chainId: ChainId.LOCALHOST,
        save: jest.fn().mockResolvedValue(true),
      };

      jobRepository.findOne = jest.fn().mockResolvedValue(mockJobEntity);

      await jobService.requestToCancelJob(userId, jobId);

      expect(jobRepository.findOne).toHaveBeenCalledWith({ id: jobId, userId });
      expect(mockJobEntity.save).toHaveBeenCalled();
      expect(paymentService.createRefundPayment).not.toHaveBeenCalled();
    });

    it('should cancel the job when status is Pending', async () => {
      const fundAmount = 1000;
      const mockJobEntity: Partial<JobEntity> = {
        id: jobId,
        userId,
        status: JobStatus.PENDING,
        chainId: ChainId.LOCALHOST,
        fundAmount: fundAmount,
        save: jest.fn().mockResolvedValue(true),
      };

      jobRepository.findOne = jest.fn().mockResolvedValue(mockJobEntity);
      paymentService.createRefundPayment = jest
        .fn()
        .mockResolvedValue(mockJobEntity);

      await jobService.requestToCancelJob(userId, jobId);

      expect(jobRepository.findOne).toHaveBeenCalledWith({ id: jobId, userId });
      expect(paymentService.createRefundPayment).toHaveBeenCalledWith({
        jobId,
        userId,
        refundAmount: fundAmount,
      });
      expect(mockJobEntity.save).toHaveBeenCalled();
    });

    it('should throw not found exception if job not found', async () => {
      jobRepository.findOne = jest.fn().mockResolvedValue(undefined);

      await expect(
        jobService.requestToCancelJob(userId, jobId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw an error if status is invalid', async () => {
      const mockJobEntity: Partial<JobEntity> = {
        id: jobId,
        userId,
        status: JobStatus.COMPLETED,
        chainId: ChainId.LOCALHOST,
        save: jest.fn().mockResolvedValue(true),
      };

      jobRepository.findOne = jest.fn().mockResolvedValue(mockJobEntity);

      await expect(
        jobService.requestToCancelJob(userId, jobId),
      ).rejects.toThrow(
        new ConflictException(ErrorJob.InvalidStatusCancellation),
      );
    });
  });

  describe('createEscrowCronJob', () => {
    let createEscrowMock: any;
    let cronJobEntityMock: Partial<CronJobEntity>;
    let jobEntityMock1: Partial<JobEntity>, jobEntityMock2: Partial<JobEntity>;

    beforeEach(() => {
      cronJobEntityMock = {
        cronJobType: CronJobType.CreateEscrow,
        createdAt: new Date(),
      };

      jobEntityMock1 = {
        status: JobStatus.PAID,
        fundAmount: 100,
        userId: 1,
        id: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        retriesCount: 1,
        save: jest.fn(),
      };

      jobEntityMock2 = {
        status: JobStatus.PAID,
        fundAmount: 100,
        userId: 1,
        id: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        retriesCount: 1,
        save: jest.fn(),
      };

      jest
        .spyOn(jobRepository, 'find')
        .mockResolvedValue([jobEntityMock1 as any, jobEntityMock2 as any]);

      createEscrowMock = jest.spyOn(jobService, 'createEscrow');
      createEscrowMock.mockResolvedValue(true);

      jest.spyOn(cronJobService, 'isCronJobRunning').mockResolvedValue(false);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should not run if the cron job is already running', async () => {
      jest
        .spyOn(cronJobService, 'isCronJobRunning')
        .mockResolvedValueOnce(true);

      await jobService.createEscrowCronJob();

      expect(createEscrowMock).not.toHaveBeenCalled();
    });

    it('should create cron job entity on database to lock', async () => {
      jest
        .spyOn(cronJobService, 'startCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await jobService.createEscrowCronJob();

      expect(cronJobService.startCronJob).toHaveBeenCalledWith(
        CronJobType.CreateEscrow,
      );
    });

    it('should run createEscrow for all of the jobs with status PAID', async () => {
      await jobService.createEscrowCronJob();

      expect(createEscrowMock).toHaveBeenCalledTimes(2);
    });

    it('should increase retriesCount by 1, if the job creation fails', async () => {
      createEscrowMock.mockRejectedValueOnce(new Error('creation failed'));

      await jobService.createEscrowCronJob();

      expect(createEscrowMock).toHaveBeenCalledTimes(2);
      expect(jobEntityMock1.retriesCount).toBe(2);
      expect(jobEntityMock2.retriesCount).toBe(1);
    });

    it('should complete the cron job entity on database to unlock', async () => {
      jest
        .spyOn(cronJobService, 'completeCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await jobService.createEscrowCronJob();

      expect(cronJobService.completeCronJob).toHaveBeenCalledWith(
        CronJobType.CreateEscrow,
      );
    });
  });

  describe('setupEscrowCronJob', () => {
    let setupEscrowMock: any;
    let cronJobEntityMock: Partial<CronJobEntity>;
    let jobEntityMock1: Partial<JobEntity>, jobEntityMock2: Partial<JobEntity>;

    beforeEach(() => {
      cronJobEntityMock = {
        cronJobType: CronJobType.SetupEscrow,
        createdAt: new Date(),
      };

      jobEntityMock1 = {
        status: JobStatus.CREATED,
        fundAmount: 100,
        userId: 1,
        id: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        retriesCount: 1,
        save: jest.fn(),
      };

      jobEntityMock2 = {
        status: JobStatus.CREATED,
        fundAmount: 100,
        userId: 1,
        id: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        retriesCount: 1,
        save: jest.fn(),
      };

      jest
        .spyOn(jobRepository, 'find')
        .mockResolvedValue([jobEntityMock1 as any, jobEntityMock2 as any]);

      setupEscrowMock = jest.spyOn(jobService, 'setupEscrow');
      setupEscrowMock.mockResolvedValue(true);

      jest.spyOn(cronJobService, 'isCronJobRunning').mockResolvedValue(false);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should not run if the cron job is already running', async () => {
      jest
        .spyOn(cronJobService, 'isCronJobRunning')
        .mockResolvedValueOnce(true);

      await jobService.setupEscrowCronJob();

      expect(setupEscrowMock).not.toHaveBeenCalled();
    });

    it('should create cron job entity on database to lock', async () => {
      jest
        .spyOn(cronJobService, 'startCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await jobService.setupEscrowCronJob();

      expect(cronJobService.startCronJob).toHaveBeenCalledWith(
        CronJobType.SetupEscrow,
      );
    });

    it('should run setupEscrow for all of the jobs with status LAUNCHING', async () => {
      await jobService.setupEscrowCronJob();

      expect(setupEscrowMock).toHaveBeenCalledTimes(2);
    });

    it('should increase retriesCount by 1, if the job setup fails', async () => {
      setupEscrowMock.mockRejectedValueOnce(new Error('setup failed'));

      await jobService.setupEscrowCronJob();

      expect(setupEscrowMock).toHaveBeenCalledTimes(2);
      expect(jobEntityMock1.retriesCount).toBe(2);
      expect(jobEntityMock2.retriesCount).toBe(1);
    });

    it('should complete the cron job entity on database to unlock', async () => {
      jest
        .spyOn(cronJobService, 'completeCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await jobService.setupEscrowCronJob();

      expect(cronJobService.completeCronJob).toHaveBeenCalledWith(
        CronJobType.SetupEscrow,
      );
    });
  });

  describe('fundEscrowCronJob', () => {
    let fundEscrowMock: any;
    let cronJobEntityMock: Partial<CronJobEntity>;
    let jobEntityMock1: Partial<JobEntity>, jobEntityMock2: Partial<JobEntity>;
    let createWebhookMock: any;

    beforeEach(() => {
      cronJobEntityMock = {
        cronJobType: CronJobType.FundEscrow,
        createdAt: new Date(),
      };

      jobEntityMock1 = {
        status: JobStatus.SET_UP,
        fundAmount: 100,
        userId: 1,
        id: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        retriesCount: 1,
        save: jest.fn(),
      };

      jobEntityMock2 = {
        status: JobStatus.SET_UP,
        fundAmount: 100,
        userId: 1,
        id: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        retriesCount: 1,
        save: jest.fn(),
      };

      jest
        .spyOn(jobRepository, 'find')
        .mockResolvedValue([jobEntityMock1 as any, jobEntityMock2 as any]);

      fundEscrowMock = jest.spyOn(jobService, 'fundEscrow');
      fundEscrowMock.mockResolvedValue(true);

      jest.spyOn(cronJobService, 'isCronJobRunning').mockResolvedValue(false);

      createWebhookMock = jest.spyOn(webhookService, 'createWebhook');

      const cvatManifestMock: DeepPartial<CvatManifestDto> = {
        data: {
          data_url: MOCK_FILE_URL,
        },
        annotation: {
          type: JobRequestType.IMAGE_POINTS,
        },
      };
      jest
        .spyOn(storageService, 'download')
        .mockResolvedValue(cvatManifestMock);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should not run if the cron job is already running', async () => {
      jest
        .spyOn(cronJobService, 'isCronJobRunning')
        .mockResolvedValueOnce(true);

      await jobService.fundEscrowCronJob();

      expect(fundEscrowMock).not.toHaveBeenCalled();
    });

    it('should create cron job entity on database to lock', async () => {
      jest
        .spyOn(cronJobService, 'startCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await jobService.fundEscrowCronJob();

      expect(cronJobService.startCronJob).toHaveBeenCalledWith(
        CronJobType.FundEscrow,
      );
    });

    it('should run fundEscrow for all of the jobs with status FUNDING, and trigger webhook', async () => {
      await jobService.fundEscrowCronJob();

      expect(fundEscrowMock).toHaveBeenCalledTimes(2);
      expect(createWebhookMock).toHaveBeenCalledTimes(2);
    });

    it('should increase retriesCount by 1, if the job fund fails', async () => {
      fundEscrowMock.mockRejectedValueOnce(new Error('fund failed'));

      await jobService.fundEscrowCronJob();

      expect(fundEscrowMock).toHaveBeenCalledTimes(2);
      expect(jobEntityMock1.retriesCount).toBe(2);
      expect(jobEntityMock2.retriesCount).toBe(1);

      expect(createWebhookMock).toHaveBeenCalledTimes(1);
    });

    it('should complete the cron job entity on database to unlock', async () => {
      jest
        .spyOn(cronJobService, 'completeCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await jobService.fundEscrowCronJob();

      expect(cronJobService.completeCronJob).toHaveBeenCalledWith(
        CronJobType.FundEscrow,
      );
    });
  });

  describe('cancelCronJob', () => {
    let findOneJobMock: any,
      findOnePaymentMock: any,
      jobEntityMock: Partial<JobEntity>,
      paymentEntityMock: Partial<PaymentEntity>;

    beforeEach(() => {
      jobEntityMock = {
        status: JobStatus.TO_CANCEL,
        fundAmount: 100,
        userId: 1,
        id: 1,
        manifestUrl: MOCK_FILE_URL,
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        save: jest.fn(),
      };

      paymentEntityMock = {
        chainId: 1,
        jobId: jobEntityMock.id,
        status: PaymentStatus.SUCCEEDED,
        save: jest.fn(),
      };
      findOneJobMock = jest.spyOn(jobRepository, 'findOne');
      findOnePaymentMock = jest.spyOn(paymentRepository, 'findOne');
      findOnePaymentMock.mockResolvedValueOnce(
        paymentEntityMock as PaymentEntity,
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return undefined when no job entity is found', async () => {
      findOneJobMock.mockResolvedValue(null);

      const result = await jobService.cancelCronJob();

      expect(result).toBeUndefined();
    });

    it('should return true when the job is successfully canceled', async () => {
      findOneJobMock.mockResolvedValue(jobEntityMock as any);

      jest
        .spyOn(jobService, 'processEscrowCancellation')
        .mockResolvedValueOnce({
          txHash: MOCK_TRANSACTION_HASH,
          amountRefunded: BigNumber.from(1),
        });

      (EscrowClient.build as any).mockImplementation(() => ({
        getExchangeOracleAddress: jest
          .fn()
          .mockResolvedValue(MOCK_EXCHANGE_ORACLE_ADDRESS),
      }));

      (KVStoreClient.build as any).mockImplementation(() => ({
        get: jest.fn().mockResolvedValue(MOCK_EXCHANGE_ORACLE_WEBHOOK_URL),
      }));

      const manifestMock = {
        requestType: JobRequestType.FORTUNE,
      };
      storageService.download = jest.fn().mockResolvedValue(manifestMock);

      const result = await jobService.cancelCronJob();

      expect(result).toBeTruthy();
      expect(jobService.processEscrowCancellation).toHaveBeenCalledWith(
        jobEntityMock,
      );
      expect(jobEntityMock.save).toHaveBeenCalled();
      expect(webhookService.createWebhook).toHaveBeenCalled();
    });

    it('should not call process escrow cancellation when escrowAddress is not present', async () => {
      const jobEntityWithoutEscrow = {
        ...jobEntityMock,
        escrowAddress: undefined,
      };

      jest
        .spyOn(jobRepository, 'findOne')
        .mockResolvedValueOnce(jobEntityWithoutEscrow as any);
      jest
        .spyOn(jobService, 'processEscrowCancellation')
        .mockResolvedValueOnce(undefined as any);
      const manifestMock = {
        requestType: JobRequestType.FORTUNE,
      };
      storageService.download = jest.fn().mockResolvedValue(manifestMock);

      expect(await jobService.cancelCronJob()).toBe(true);
      expect(jobService.processEscrowCancellation).toHaveBeenCalledTimes(0);
    });

    it('should throw bad request exception if escrowStatus is Complete', async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Complete),
      }));

      await expect(
        jobService.processEscrowCancellation(jobEntityMock as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw bad request exception if escrowStatus is Paid', async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Paid),
      }));

      await expect(
        jobService.processEscrowCancellation(jobEntityMock as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw bad request exception if escrowStatus is Cancelled', async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Cancelled),
      }));

      await expect(
        jobService.processEscrowCancellation(jobEntityMock as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw bad request exception if escrow balance is zero', async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Launched),
        getBalance: jest.fn().mockResolvedValue({ eq: () => true }),
      }));

      await expect(
        jobService.processEscrowCancellation(jobEntityMock as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getResult', () => {
    let downloadFileFromUrlMock: any;
    const jobEntityMock = {
      status: JobStatus.COMPLETED,
      fundAmount: 100,
      userId: 1,
      id: 1,
      manifestUrl: MOCK_FILE_URL,
      manifestHash: MOCK_FILE_HASH,
      escrowAddress: MOCK_ADDRESS,
      chainId: ChainId.LOCALHOST,
      save: jest.fn(),
    };

    beforeEach(() => {
      downloadFileFromUrlMock = storageService.download;
      jobRepository.findOne = jest.fn().mockResolvedValue(jobEntityMock);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should download and return the fortune result', async () => {
      const fortuneResult: FortuneFinalResultDto[] = [
        {
          workerAddress: MOCK_ADDRESS,
          solution: 'good',
        },
        {
          workerAddress: MOCK_ADDRESS,
          solution: 'bad',
          error: 'wrong answer',
        },
      ];

      (EscrowClient.build as any).mockImplementation(() => ({
        getResultsUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
      }));
      downloadFileFromUrlMock.mockResolvedValueOnce(MOCK_MANIFEST);
      downloadFileFromUrlMock.mockResolvedValueOnce(fortuneResult);

      const result = await jobService.getResult(MOCK_USER_ID, MOCK_JOB_ID);

      expect(storageService.download).toHaveBeenCalledWith(MOCK_FILE_URL);
      expect(storageService.download).toHaveBeenCalledTimes(2);
      expect(result).toEqual(fortuneResult);
    });

    it('should download and return the image binary result', async () => {
      const manifestMock = {
        requestType: JobRequestType.IMAGE_BOXES,
      };

      (EscrowClient.build as any).mockImplementation(() => ({
        getResultsUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
      }));

      downloadFileFromUrlMock.mockResolvedValue(manifestMock);

      const result = await jobService.getResult(MOCK_USER_ID, MOCK_JOB_ID);

      expect(storageService.download).toHaveBeenCalledWith(MOCK_FILE_URL);
      expect(result).toEqual(MOCK_FILE_URL);
    });

    it('should throw a NotFoundException if the result is not found', async () => {
      downloadFileFromUrlMock.mockResolvedValueOnce(MOCK_MANIFEST);
      downloadFileFromUrlMock.mockResolvedValueOnce(null);

      await expect(
        jobService.getResult(MOCK_USER_ID, MOCK_JOB_ID),
      ).rejects.toThrowError(new NotFoundException(ErrorJob.ResultNotFound));
      expect(storageService.download).toHaveBeenCalledWith(MOCK_FILE_URL);
      expect(storageService.download).toHaveBeenCalledTimes(2);
    });

    it('should throw a NotFoundException if the result is not valid', async () => {
      const fortuneResult: any[] = [
        {
          wrongAddress: MOCK_ADDRESS,
          solution: 1,
        },
        {
          wrongAddress: MOCK_ADDRESS,
          solution: 1,
          error: 1,
        },
      ];

      (EscrowClient.build as any).mockImplementation(() => ({
        getResultsUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
      }));
      downloadFileFromUrlMock.mockResolvedValueOnce(MOCK_MANIFEST);
      downloadFileFromUrlMock.mockResolvedValueOnce(fortuneResult);

      await expect(
        jobService.getResult(MOCK_USER_ID, MOCK_JOB_ID),
      ).rejects.toThrowError(
        new NotFoundException(ErrorJob.ResultValidationFailed),
      );

      expect(storageService.download).toHaveBeenCalledWith(MOCK_FILE_URL);
      expect(storageService.download).toHaveBeenCalledTimes(2);
    });
  });

  describe('getJobsByStatus', () => {
    const userId = 1;
    const skip = 0;
    const limit = 5;

    it('should call the database with PENDING status', async () => {
      jobService.getJobsByStatus(
        [ChainId.LOCALHOST],
        userId,
        JobStatusFilter.PENDING,
        skip,
        limit,
      );
      expect(jobRepository.findJobsByStatusFilter).toHaveBeenCalledWith(
        [ChainId.LOCALHOST],
        userId,
        JobStatusFilter.PENDING,
        skip,
        limit,
      );
    });
    it('should call the database with FAILED status', async () => {
      jobService.getJobsByStatus(
        [ChainId.LOCALHOST],
        userId,
        JobStatusFilter.FAILED,
        skip,
        limit,
      );
      expect(jobRepository.findJobsByStatusFilter).toHaveBeenCalledWith(
        [ChainId.LOCALHOST],
        userId,
        JobStatusFilter.FAILED,
        skip,
        limit,
      );
    });
    it('should call subgraph and database with LAUNCHED status', async () => {
      const jobEntityMock = [
        {
          status: JobStatus.LAUNCHED,
          fundAmount: 100,
          userId: 1,
          id: 1,
          escrowAddress: MOCK_ADDRESS,
          chainId: ChainId.LOCALHOST,
        },
      ];
      const getEscrowsData = [
        {
          address: MOCK_ADDRESS,
          status: EscrowStatus[EscrowStatus.Launched],
        },
      ];
      jobRepository.findJobsByEscrowAddresses = jest
        .fn()
        .mockResolvedValue(jobEntityMock as any);
      EscrowUtils.getEscrows = jest.fn().mockResolvedValue(getEscrowsData);

      const results = await jobService.getJobsByStatus(
        [ChainId.LOCALHOST],
        userId,
        JobStatusFilter.LAUNCHED,
        skip,
        limit,
      );

      expect(results).toMatchObject([
        {
          status: JobStatus.LAUNCHED,
          fundAmount: 100,
          jobId: 1,
          escrowAddress: MOCK_ADDRESS,
          network: NETWORKS[ChainId.LOCALHOST]?.title,
        },
      ]);
      expect(jobRepository.findJobsByEscrowAddresses).toHaveBeenCalledWith(
        userId,
        [MOCK_ADDRESS, MOCK_ADDRESS, MOCK_ADDRESS, MOCK_ADDRESS],
      );
    });
    it('should call the database with CANCELLED status', async () => {
      jobService.getJobsByStatus(
        [ChainId.LOCALHOST],
        userId,
        JobStatusFilter.PENDING,
        skip,
        limit,
      );
      expect(jobRepository.findJobsByStatusFilter).toHaveBeenCalledWith(
        [ChainId.LOCALHOST],
        userId,
        JobStatusFilter.PENDING,
        skip,
        limit,
      );
    });
  });

  describe('escrowFailedWebhook', () => {
    it('should throw BadRequestException for invalid event type', async () => {
      const dto = {
        eventType: 'ANOTHER_EVENT' as EventType,
        chainId: 1,
        escrowAddress: 'address',
        reason: 'invalid manifest',
      };

      await expect(jobService.escrowFailedWebhook(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if jobEntity is not found', async () => {
      const dto = {
        eventType: EventType.TASK_CREATION_FAILED,
        chainId: 1,
        escrowAddress: 'address',
        reason: 'invalid manifest',
      };
      jobRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(jobService.escrowFailedWebhook(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if jobEntity status is not LAUNCHED', async () => {
      const dto = {
        eventType: EventType.TASK_CREATION_FAILED,
        chainId: 1,
        escrowAddress: 'address',
        reason: 'invalid manifest',
      };
      const mockJobEntity = {
        status: 'ANOTHER_STATUS' as JobStatus,
        save: jest.fn(),
      };
      jobRepository.findOne = jest.fn().mockResolvedValue(mockJobEntity);

      await expect(jobService.escrowFailedWebhook(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should update jobEntity status to FAILED and return true if all checks pass', async () => {
      const dto = {
        eventType: EventType.TASK_CREATION_FAILED,
        chainId: 1,
        escrowAddress: 'address',
        reason: 'invalid manifest',
      };
      const mockJobEntity = {
        status: JobStatus.LAUNCHED,
        failedReason: dto.reason,
        save: jest.fn(),
      };
      jobRepository.findOne = jest.fn().mockResolvedValue(mockJobEntity);

      await jobService.escrowFailedWebhook(dto);

      expect(mockJobEntity.status).toBe(JobStatus.FAILED);
      expect(mockJobEntity.failedReason).toBe(dto.reason);
      expect(mockJobEntity.save).toHaveBeenCalled();
    });
  });

  describe('getDetails', () => {
    it('should return job details with escrow address successfully', async () => {
      const balance = '1';
      const allocationMock: IAllocation = {
        escrowAddress: ethers.constants.AddressZero,
        staker: ethers.constants.AddressZero,
        tokens: BigNumber.from('1'),
        createdAt: BigNumber.from('1'),
        closedAt: BigNumber.from('1'),
      };

      const manifestMock: FortuneManifestDto = {
        submissionsRequired: 10,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: 10,
        requestType: JobRequestType.FORTUNE,
      };

      const jobEntityMock = {
        status: JobStatus.TO_CANCEL,
        fundAmount: 100,
        userId: 1,
        id: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        save: jest.fn(),
      };

      const expectedJobDetailsDto: JobDetailsDto = {
        details: {
          escrowAddress: MOCK_ADDRESS,
          manifestUrl: MOCK_FILE_URL,
          manifestHash: MOCK_FILE_HASH,
          balance: expect.any(Number),
          paidOut: expect.any(Number),
          status: JobStatus.TO_CANCEL,
        },
        manifest: {
          chainId: ChainId.LOCALHOST,
          title: MOCK_REQUESTER_TITLE,
          description: MOCK_REQUESTER_DESCRIPTION,
          submissionsRequired: expect.any(Number),
          tokenAddress: MOCK_ADDRESS,
          fundAmount: expect.any(Number),
          requesterAddress: MOCK_ADDRESS,
          requestType: JobRequestType.FORTUNE,
          exchangeOracleAddress: expect.any(String),
          recordingOracleAddress: expect.any(String),
          reputationOracleAddress: expect.any(String),
        },
        staking: {
          staker: expect.any(String),
          allocated: expect.any(Number),
          slashed: 0,
        },
      };

      const getEscrowData = {
        token: MOCK_ADDRESS,
        totalFundedAmount: '100',
        balance: Number(balance),
        amountPaid: '10',
        exchangeOracle: MOCK_ADDRESS,
        recordingOracle: MOCK_ADDRESS,
        reputationOracle: MOCK_ADDRESS,
      };

      jobRepository.findOne = jest.fn().mockResolvedValue(jobEntityMock as any);
      EscrowUtils.getEscrow = jest.fn().mockResolvedValue(getEscrowData);
      (StakingClient.build as any).mockImplementation(() => ({
        getAllocation: jest.fn().mockResolvedValue(allocationMock),
      }));
      storageService.download = jest.fn().mockResolvedValue(manifestMock);
      jobService.getPaidOutAmount = jest.fn().mockResolvedValue(10);

      const result = await jobService.getDetails(1, 123);
      expect(result).toMatchObject(expectedJobDetailsDto);
    });

    it('should return job details without escrow address successfully', async () => {
      const manifestMock: FortuneManifestDto = {
        submissionsRequired: 10,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: 10,
        requestType: JobRequestType.FORTUNE,
      };

      const jobEntityMock = {
        status: JobStatus.TO_CANCEL,
        fundAmount: 100,
        userId: 1,
        id: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: null,
        chainId: ChainId.LOCALHOST,
        save: jest.fn(),
      };

      const expectedJobDetailsDto: JobDetailsDto = {
        details: {
          escrowAddress: ethers.constants.AddressZero,
          manifestUrl: MOCK_FILE_URL,
          manifestHash: MOCK_FILE_HASH,
          balance: 0,
          paidOut: 0,
          status: JobStatus.TO_CANCEL,
        },
        manifest: {
          chainId: ChainId.LOCALHOST,
          title: MOCK_REQUESTER_TITLE,
          description: MOCK_REQUESTER_DESCRIPTION,
          submissionsRequired: expect.any(Number),
          tokenAddress: ethers.constants.AddressZero,
          fundAmount: expect.any(Number),
          requesterAddress: MOCK_ADDRESS,
          requestType: JobRequestType.FORTUNE,
          exchangeOracleAddress: ethers.constants.AddressZero,
          recordingOracleAddress: ethers.constants.AddressZero,
          reputationOracleAddress: ethers.constants.AddressZero,
        },
        staking: {
          staker: expect.any(String),
          allocated: 0,
          slashed: 0,
        },
      };

      jobRepository.findOne = jest.fn().mockResolvedValue(jobEntityMock as any);
      storageService.download = jest.fn().mockResolvedValue(manifestMock);
      jobService.getPaidOutAmount = jest.fn().mockResolvedValue(10);

      const result = await jobService.getDetails(1, 123);
      expect(result).toMatchObject(expectedJobDetailsDto);
    });

    it('should throw not found exception when job not found', async () => {
      jobService.jobRepository.findOne = jest.fn().mockResolvedValue(undefined);

      await expect(jobService.getDetails(1, 123)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTransferLogs', () => {
    it('should retrieve logs', async () => {
      const chainId = ChainId.LOCALHOST;
      web3Service.getSigner = jest.fn().mockReturnValue({
        ...signerMock,
        provider: {
          getLogs: jest.fn().mockResolvedValue([{}]),
          getBlockNumber: jest.fn().mockResolvedValue(100),
        },
      });

      await jobService.getTransferLogs(chainId, MOCK_ADDRESS, 0, 'latest');
      expect(
        web3Service.getSigner(chainId).provider.getLogs,
      ).toHaveBeenCalled();
    });
  });

  describe('getPaidOutAmount', () => {
    it('should calculate the paid out amount', async () => {
      const chainId = ChainId.LOCALHOST;
      const amount = ethers.utils.parseEther('1.5');
      const mockLogs = [
        {
          data: 'mockData',
          topics: ['mockTopic'],
        },
      ];

      const mockParsedLog = {
        args: [MOCK_ADDRESS, MOCK_ADDRESS, amount],
      };

      web3Service.getSigner = jest.fn().mockReturnValue({
        ...signerMock,
        provider: {
          getLogs: jest.fn().mockResolvedValue(mockLogs),
        },
      });

      const mockHMTokenFactoryContract = {
        interface: {
          parseLog: jest.fn().mockReturnValue({
            args: [MOCK_ADDRESS, MOCK_ADDRESS, amount],
          }),
        },
      };

      jest
        .spyOn(HMToken__factory, 'connect')
        .mockReturnValue(mockHMTokenFactoryContract as any);

      (ethers as any).Contract.prototype.interface = {
        parseLog: jest.fn().mockReturnValue(mockParsedLog),
      };

      const result = await jobService.getPaidOutAmount(
        chainId,
        MOCK_ADDRESS,
        MOCK_ADDRESS,
      );
      expect(result).toBe(1.5);
    });
  });

  describe('getOracleFee', () => {
    it('should get the oracle fee', async () => {
      web3Service.getSigner = jest.fn().mockReturnValue({
        ...signerMock,
        provider: {
          getLogs: jest.fn().mockResolvedValue([{}]),
          getBlockNumber: jest.fn().mockResolvedValue(100),
        },
      });

      (KVStoreClient.build as any).mockImplementation(() => ({
        get: jest.fn().mockResolvedValue(MOCK_ORACLE_FEE),
      }));

      const result = await (jobService as any).getOracleFee(
        MOCK_EXCHANGE_ORACLE_ADDRESS,
        ChainId.LOCALHOST,
      );

      expect(result.toNumber()).toBe(MOCK_ORACLE_FEE);
      expect(result).toBeInstanceOf(BigNumber);
    });
  });
});
