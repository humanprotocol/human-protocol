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
  Encryption,
  KVStoreClient,
} from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
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
  MOCK_FILE_HASH,
  MOCK_FILE_URL,
  MOCK_HCAPTCHA_ORACLE_ADDRESS,
  MOCK_JOB_ID,
  MOCK_JOB_LAUNCHER_FEE,
  MOCK_PGP_PRIVATE_KEY,
  MOCK_PGP_PUBLIC_KEY,
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
  MOCK_BUCKET_FILE,
  MOCK_MAX_RETRY_COUNT,
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
  JobQuickLaunchDto,
} from './job.dto';
import { JobEntity } from './job.entity';
import { JobRepository } from './job.repository';
import { WebhookRepository } from '../webhook/webhook.repository';
import { JobService } from './job.service';

import { div, mul } from '../../common/utils/decimal';
import { PaymentRepository } from '../payment/payment.repository';
import { RoutingProtocolService } from './routing-protocol.service';
import { EventType } from '../../common/enums/webhook';
import { ethers } from 'ethers';
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
  KVStoreClient: {
    build: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      getPublicKey: jest.fn(),
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
    encryption: Encryption,
    storageService: StorageService,
    webhookRepository: WebhookRepository;

  let encrypt = true;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  beforeEach(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string) => {
        switch (key) {
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
          case 'PGP_ENCRYPT':
            return encrypt;
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
          case 'MAX_RETRY_COUNT':
            return MOCK_MAX_RETRY_COUNT;
        }
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        JobService,
        Encryption,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
            validateChainId: jest.fn().mockReturnValue(new Error()),
            calculateGasPrice: jest.fn().mockReturnValue(1000n),
            getOperatorAddress: jest.fn().mockReturnValue(MOCK_ADDRESS),
          },
        },
        { provide: JobRepository, useValue: createMock<JobRepository>() },
        {
          provide: WebhookRepository,
          useValue: createMock<WebhookRepository>(),
        },
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
    paymentRepository = moduleRef.get<PaymentRepository>(PaymentRepository);
    paymentService = moduleRef.get(PaymentService);
    routingProtocolService = moduleRef.get(RoutingProtocolService);
    createPaymentMock = jest.spyOn(paymentRepository, 'createUnique');
    web3Service = moduleRef.get<Web3Service>(Web3Service);
    webhookRepository = moduleRef.get<WebhookRepository>(WebhookRepository);
    storageService = moduleRef.get<StorageService>(StorageService);

    storageService.uploadFile = jest.fn().mockResolvedValue({
      url: MOCK_FILE_URL,
      hash: MOCK_FILE_HASH,
    });

    storageService.download = jest.fn();
  });

  beforeEach(async () => {
    encryption = await Encryption.build(MOCK_PGP_PRIVATE_KEY);
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
        requestType: JobRequestType.FORTUNE,
        escrowAddress: MOCK_ADDRESS,
        fee,
        fundAmount,
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      (KVStoreClient.build as any)
        .mockImplementationOnce(() => ({
          get: jest.fn().mockResolvedValue(MOCK_ORACLE_FEE),
        }))
        .mockImplementation(() => ({
          getPublicKey: jest.fn().mockResolvedValue(MOCK_PGP_PUBLIC_KEY),
          getPublickKey: jest.fn().mockResolvedValue(MOCK_PGP_PUBLIC_KEY),
        }));

      jobRepository.createUnique = jest.fn().mockResolvedValue(mockJobEntity);

      await jobService.createJob(userId, JobRequestType.FORTUNE, fortuneJobDto);

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(userId);
      expect(paymentRepository.createUnique).toHaveBeenCalledWith({
        userId,
        jobId,
        source: PaymentSource.BALANCE,
        type: PaymentType.WITHDRAWAL,
        currency: TokenId.HMT,
        amount: -mul(fundAmount + fee, rate),
        rate: div(1, rate),
        status: PaymentStatus.SUCCEEDED,
      });
      expect(jobRepository.createUnique).toHaveBeenCalledWith({
        chainId: fortuneJobDto.chainId,
        userId,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        requestType: JobRequestType.FORTUNE,
        fee: mul(fee, rate),
        fundAmount: mul(fundAmount, rate),
        status: JobStatus.PENDING,
        waitUntil: expect.any(Date),
      });
    });

    it('should create a job using quick launch successfully', async () => {
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
        requestType: JobRequestType.HCAPTCHA,
        escrowAddress: MOCK_ADDRESS,
        fee,
        fundAmount,
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      (KVStoreClient.build as any)
        .mockImplementationOnce(() => ({
          get: jest.fn().mockResolvedValue(MOCK_ORACLE_FEE),
        }))
        .mockImplementation(() => ({
          getPublicKey: jest.fn().mockResolvedValue(MOCK_PGP_PUBLIC_KEY),
          getPublickKey: jest.fn().mockResolvedValue(MOCK_PGP_PUBLIC_KEY),
        }));

      jobRepository.createUnique = jest.fn().mockResolvedValue(mockJobEntity);

      // Create a quick launch payload
      const quickLaunchJobDto = new JobQuickLaunchDto();
      quickLaunchJobDto.chainId = MOCK_CHAIN_ID;
      quickLaunchJobDto.requestType = JobRequestType.HCAPTCHA;
      quickLaunchJobDto.manifestUrl = MOCK_FILE_URL;
      quickLaunchJobDto.manifestHash = MOCK_FILE_HASH;
      quickLaunchJobDto.fundAmount = fundAmount;

      await jobService.createJob(
        userId,
        JobRequestType.HCAPTCHA,
        quickLaunchJobDto,
      );

      // Methods won't be invoked as the quick launch call includes a manifest data.
      jobService.createHCaptchaManifest = jest.fn();
      jobService.uploadManifest = jest.fn();
      expect(jobService.createHCaptchaManifest).toHaveBeenCalledTimes(0);
      expect(jobService.uploadManifest).toHaveBeenCalledTimes(0);

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(userId);
      expect(paymentRepository.createUnique).toHaveBeenCalledWith({
        userId,
        jobId,
        source: PaymentSource.BALANCE,
        type: PaymentType.WITHDRAWAL,
        currency: TokenId.HMT,
        amount: -mul(fundAmount + fee, rate),
        rate: div(1, rate),
        status: PaymentStatus.SUCCEEDED,
      });
      expect(jobRepository.createUnique).toHaveBeenCalledWith({
        chainId: quickLaunchJobDto.chainId,
        userId,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        requestType: JobRequestType.HCAPTCHA,
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

      (KVStoreClient.build as any)
        .mockImplementationOnce(() => ({
          get: jest.fn().mockResolvedValue(MOCK_ORACLE_FEE),
        }))
        .mockImplementation(() => ({
          getPublicKey: jest.fn().mockResolvedValue(MOCK_PGP_PUBLIC_KEY),
        }));

      await jobService.createJob(userId, JobRequestType.FORTUNE, {
        ...fortuneJobDto,
        chainId: undefined,
      });

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(userId);
      expect(jobRepository.createUnique).toHaveBeenCalledWith({
        chainId: ChainId.MOONBEAM,
        userId,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        requestType: JobRequestType.FORTUNE,
        fee: mul(fee, rate),
        fundAmount: mul(fundAmount, rate),
        status: JobStatus.PENDING,
        waitUntil: expect.any(Date),
      });
    });

    it('should throw an exception for invalid chain id provided', async () => {
      web3Service.validateChainId = jest.fn(() => {
        throw new Error(ErrorWeb3.InvalidChainId);
      });

      await expect(
        jobService.createJob(userId, JobRequestType.FORTUNE, fortuneJobDto),
      ).rejects.toThrowError(ErrorWeb3.InvalidChainId);
    });

    it('should throw an exception for insufficient user balance', async () => {
      const userBalance = 1;
      jest
        .spyOn(paymentService, 'getUserBalance')
        .mockResolvedValue(userBalance);

      (KVStoreClient.build as any).mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue(MOCK_ORACLE_FEE),
      }));

      getUserBalanceMock.mockResolvedValue(userBalance);

      await expect(
        jobService.createJob(userId, JobRequestType.FORTUNE, fortuneJobDto),
      ).rejects.toThrowError(ErrorJob.NotEnoughFunds);
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

      const result = await jobService.createHCaptchaManifest(jobDto);

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

      const result = await jobService.createHCaptchaManifest(jobDto);

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

      const result = await jobService.createHCaptchaManifest(jobDto);

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

      const result = await jobService.createHCaptchaManifest(jobDto);

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

      const result = await jobService.createHCaptchaManifest(jobDto);

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
        jobService.createHCaptchaManifest(jobDto),
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
        requestType: JobRequestType.IMAGE_BOXES,
        escrowAddress: MOCK_ADDRESS,
        fee,
        fundAmount,
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      jobRepository.createUnique = jest.fn().mockResolvedValue(mockJobEntity);

      (KVStoreClient.build as any)
        .mockImplementationOnce(() => ({
          get: jest.fn().mockResolvedValue(MOCK_ORACLE_FEE),
        }))
        .mockImplementation(() => ({
          getPublicKey: jest.fn().mockResolvedValue(MOCK_PGP_PUBLIC_KEY),
        }));

      await jobService.createJob(
        userId,
        JobRequestType.IMAGE_POINTS,
        imageLabelBinaryJobDto,
      );

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(userId);
      expect(paymentRepository.createUnique).toHaveBeenCalledWith({
        userId,
        jobId,
        source: PaymentSource.BALANCE,
        type: PaymentType.WITHDRAWAL,
        currency: TokenId.HMT,
        amount: -mul(fundAmount + fee, rate),
        rate: div(1, rate),
        status: PaymentStatus.SUCCEEDED,
      });
      expect(jobRepository.createUnique).toHaveBeenCalledWith({
        chainId: imageLabelBinaryJobDto.chainId,
        userId,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        requestType: JobRequestType.IMAGE_POINTS,
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

      (KVStoreClient.build as any).mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue(MOCK_ORACLE_FEE),
      }));

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

      (KVStoreClient.build as any).mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue(MOCK_ORACLE_FEE),
      }));

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

      (KVStoreClient.build as any).mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue(MOCK_ORACLE_FEE),
      }));

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

      (KVStoreClient.build as any).mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue(MOCK_ORACLE_FEE),
      }));

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

      (KVStoreClient.build as any)
        .mockImplementationOnce(() => ({
          get: jest.fn().mockResolvedValue(MOCK_ORACLE_FEE),
        }))
        .mockImplementation(() => ({
          getPublicKey: jest.fn().mockResolvedValue(MOCK_PGP_PUBLIC_KEY),
        }));

      await jobService.createJob(userId, JobRequestType.IMAGE_POINTS, {
        ...imageLabelBinaryJobDto,
        chainId: undefined,
      });

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(userId);
      expect(jobRepository.createUnique).toHaveBeenCalledWith({
        chainId: ChainId.MOONBEAM,
        userId,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        requestType: JobRequestType.IMAGE_POINTS,
        fee: mul(fee, rate),
        fundAmount: mul(fundAmount, rate),
        status: JobStatus.PENDING,
        waitUntil: expect.any(Date),
      });
    });

    it('should throw an exception for invalid chain id provided', async () => {
      web3Service.validateChainId = jest.fn(() => {
        throw new Error(ErrorWeb3.InvalidChainId);
      });

      await expect(
        jobService.createJob(
          userId,
          JobRequestType.IMAGE_POINTS,
          imageLabelBinaryJobDto,
        ),
      ).rejects.toThrowError(ErrorWeb3.InvalidChainId);
    });

    it('should throw an exception for insufficient user balance', async () => {
      const userBalance = 1;

      jest
        .spyOn(paymentService, 'getUserBalance')
        .mockResolvedValue(userBalance);

      getUserBalanceMock.mockResolvedValue(userBalance);

      (KVStoreClient.build as any).mockImplementationOnce(() => ({
        get: jest.fn().mockResolvedValue(MOCK_ORACLE_FEE),
      }));

      await expect(
        jobService.createJob(
          userId,
          JobRequestType.IMAGE_POINTS,
          imageLabelBinaryJobDto,
        ),
      ).rejects.toThrowError(ErrorJob.NotEnoughFunds);
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
      (KVStoreClient.build as any)
        .mockImplementationOnce(() => ({
          get: jest.fn().mockResolvedValue(MOCK_ORACLE_FEE),
        }))
        .mockImplementation(() => ({
          getPublicKey: jest.fn().mockResolvedValue(MOCK_PGP_PUBLIC_KEY),
        }));
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
        requestType: JobRequestType.HCAPTCHA,
        escrowAddress: MOCK_ADDRESS,
        fee,
        fundAmount,
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      jobRepository.createUnique = jest.fn().mockResolvedValue(mockJobEntity);

      await jobService.createJob(
        userId,
        JobRequestType.HCAPTCHA,
        hCaptchaJobDto,
      );

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(userId);
      expect(paymentRepository.createUnique).toHaveBeenCalledWith({
        userId,
        jobId,
        source: PaymentSource.BALANCE,
        type: PaymentType.WITHDRAWAL,
        currency: TokenId.HMT,
        amount: -mul(fundAmount + fee, rate),
        rate: div(1, rate),
        status: PaymentStatus.SUCCEEDED,
      });
      expect(jobRepository.createUnique).toHaveBeenCalledWith({
        chainId: hCaptchaJobDto.chainId,
        userId,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        requestType: JobRequestType.HCAPTCHA,
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
      expect(jobRepository.createUnique).toHaveBeenCalledWith({
        chainId: ChainId.MOONBEAM,
        userId,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        requestType: JobRequestType.HCAPTCHA,
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
        requestType: JobRequestType.FORTUNE,
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
      expect(jobRepository.updateOne).toHaveBeenCalled();
    });

    it('should handle error during job creation', async () => {
      (EscrowClient.build as any).mockImplementationOnce(() => ({
        createEscrow: jest.fn().mockRejectedValue(new Error()),
      }));

      const mockJobEntity: Partial<JobEntity> = {
        chainId: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        requestType: JobRequestType.FORTUNE,
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

    beforeAll(() => {
      (KVStoreClient.build as any).mockImplementation(() => ({
        get: jest.fn().mockResolvedValue(MOCK_ORACLE_FEE),
      }));
    });

    it('should setup escrow and update the status to funding', async () => {
      const fundAmount = 10;
      const fee = (MOCK_JOB_LAUNCHER_FEE / 100) * fundAmount;

      const mockJobEntity: Partial<JobEntity> = {
        chainId,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        requestType: JobRequestType.FORTUNE,
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
      expect(jobRepository.updateOne).toHaveBeenCalled();
      expect(jobEntityResult).toMatchObject(mockJobEntity);
    });

    it('should validate manifest before setup', async () => {
      const fundAmount = 10;
      const fee = (MOCK_JOB_LAUNCHER_FEE / 100) * fundAmount;

      const mockJobEntity: Partial<JobEntity> = {
        chainId,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        requestType: JobRequestType.FORTUNE,
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
        requestType: JobRequestType.FORTUNE,
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
    let createWebhookMock: any;
    const chainId = ChainId.LOCALHOST;

    it('should fund escrow and update the status to launched', async () => {
      const fundAmount = 10;
      const fee = (MOCK_JOB_LAUNCHER_FEE / 100) * fundAmount;
      createWebhookMock = jest.spyOn(webhookRepository, 'createUnique');
      const mockJobEntity: Partial<JobEntity> = {
        chainId,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        requestType: JobRequestType.FORTUNE,
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
      expect(jobRepository.updateOne).toHaveBeenCalled();
      expect(jobEntityResult).toMatchObject(mockJobEntity);
      expect(createWebhookMock).toHaveBeenCalledTimes(1);
    });

    it('should handle error during job fund', async () => {
      createWebhookMock = jest.spyOn(webhookRepository, 'createUnique');
      (EscrowClient.build as any).mockImplementationOnce(() => ({
        fund: jest.fn().mockRejectedValue(new Error()),
      }));

      const mockJobEntity: Partial<JobEntity> = {
        chainId: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        requestType: JobRequestType.FORTUNE,
        status: JobStatus.SET_UP,
        save: jest.fn().mockResolvedValue(true),
      };

      await expect(
        jobService.fundEscrow(mockJobEntity as JobEntity),
      ).rejects.toThrow();
      expect(createWebhookMock).not.toHaveBeenCalled();
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

      jobRepository.findOneByIdAndUserId = jest
        .fn()
        .mockResolvedValue(mockJobEntity);

      await jobService.requestToCancelJob(userId, jobId);

      expect(jobRepository.findOneByIdAndUserId).toHaveBeenCalledWith(
        jobId,
        userId,
      );
      expect(jobRepository.updateOne).toHaveBeenCalled();
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

      jobRepository.findOneByIdAndUserId = jest
        .fn()
        .mockResolvedValue(mockJobEntity);
      paymentService.createRefundPayment = jest
        .fn()
        .mockResolvedValue(mockJobEntity);

      await jobService.requestToCancelJob(userId, jobId);

      expect(jobRepository.findOneByIdAndUserId).toHaveBeenCalledWith(
        jobId,
        userId,
      );
      expect(paymentService.createRefundPayment).toHaveBeenCalledWith({
        jobId,
        userId,
        refundAmount: fundAmount,
      });
      expect(jobRepository.updateOne).toHaveBeenCalled();
    });

    it('should throw not found exception if job not found', async () => {
      jobRepository.findOneByIdAndUserId = jest
        .fn()
        .mockResolvedValue(undefined);

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

      jobRepository.findOneByIdAndUserId = jest
        .fn()
        .mockResolvedValue(mockJobEntity);

      await expect(
        jobService.requestToCancelJob(userId, jobId),
      ).rejects.toThrow(
        new ConflictException(ErrorJob.InvalidStatusCancellation),
      );
    });
  });

  describe('processEscrowCancellation', () => {
    const jobEntityMock = {
      status: JobStatus.TO_CANCEL,
      fundAmount: 100,
      userId: 1,
      id: 1,
      manifestUrl: MOCK_FILE_URL,
      manifestHash: MOCK_FILE_HASH,
      escrowAddress: MOCK_ADDRESS,
      chainId: ChainId.LOCALHOST,
      retriesCount: 1,
    };

    it('should cancel escrow', async () => {
      const fundedAmount = 1n;

      const escrowClientMock = {
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Launched),
        getBalance: jest.fn().mockResolvedValue(fundedAmount),
        cancel: jest.fn().mockResolvedValue({
          amountRefunded: fundedAmount,
          txHash: MOCK_TRANSACTION_HASH,
        }),
      };

      (EscrowClient.build as any).mockImplementation(() => escrowClientMock);

      const result = await jobService.processEscrowCancellation(
        jobEntityMock as any,
      );

      expect(result).toEqual({
        amountRefunded: fundedAmount,
        txHash: MOCK_TRANSACTION_HASH,
      });
      expect(escrowClientMock.cancel).toHaveBeenCalled();
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
        getBalance: jest.fn().mockResolvedValue(0n),
      }));

      await expect(
        jobService.processEscrowCancellation(jobEntityMock as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('uploadManifest with fortune request type and encryption', () => {
    const chainId = ChainId.LOCALHOST;
    const fortuneManifestParams = {
      requestType: JobRequestType.FORTUNE,
      submissionsRequired: MOCK_SUBMISSION_REQUIRED,
      requesterDescription: MOCK_REQUESTER_DESCRIPTION,
      fundAmount: 10,
      requesterTitle: MOCK_REQUESTER_TITLE,
    };

    let uploadFilesMock: any;

    beforeEach(() => {
      uploadFilesMock = jest.spyOn(storageService, 'uploadFile');
    });

    beforeAll(() => {
      (KVStoreClient.build as any).mockImplementation(() => ({
        getPublicKey: jest.fn().mockResolvedValue(MOCK_PGP_PUBLIC_KEY),
      }));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should save the manifest and return the manifest URL and hash', async () => {
      uploadFilesMock.mockResolvedValue([
        {
          url: MOCK_FILE_URL,
          hash: MOCK_FILE_HASH,
        },
      ]);

      const result = await jobService.uploadManifest(
        JobRequestType.FORTUNE,
        chainId,
        fortuneManifestParams,
      );

      expect(result).toEqual([
        {
          url: MOCK_FILE_URL,
          hash: MOCK_FILE_HASH,
        },
      ]);

      expect(storageService.uploadFile).toHaveBeenCalled();
      expect(
        JSON.parse(
          await encryption.decrypt(
            (storageService.uploadFile as any).mock.calls[0][0],
          ),
        ),
      ).toEqual(fortuneManifestParams);
    });

    it('should throw an error if the manifest file fails to upload', async () => {
      const uploadError = new Error(ErrorBucket.UnableSaveFile);

      uploadFilesMock.mockRejectedValue(uploadError);

      await expect(
        jobService.uploadManifest(
          JobRequestType.FORTUNE,
          chainId,
          fortuneManifestParams,
        ),
      ).rejects.toThrowError(
        new BadGatewayException(ErrorBucket.UnableSaveFile),
      );

      expect(storageService.uploadFile).toHaveBeenCalled();
      expect(
        JSON.parse(
          await encryption.decrypt(
            (storageService.uploadFile as any).mock.calls[0][0],
          ),
        ),
      ).toEqual(fortuneManifestParams);
    });

    it('should rethrow any other errors encountered', async () => {
      const errorMessage = 'Something went wrong';
      const uploadError = new Error(errorMessage);

      uploadFilesMock.mockRejectedValue(uploadError);

      await expect(
        jobService.uploadManifest(
          JobRequestType.FORTUNE,
          chainId,
          fortuneManifestParams,
        ),
      ).rejects.toThrowError(new Error(errorMessage));

      expect(storageService.uploadFile).toHaveBeenCalled();
      expect(
        JSON.parse(
          await encryption.decrypt(
            (storageService.uploadFile as any).mock.calls[0][0],
          ),
        ),
      ).toEqual(fortuneManifestParams);
    });
  });

  describe('uploadManifest with image label binary request type and encryption', () => {
    const chainId = ChainId.LOCALHOST;
    const manifest: CvatManifestDto = {
      data: {
        data_url: MOCK_FILE_URL,
      },
      annotation: {
        labels: [{ name: 'label1' }],
        description: MOCK_REQUESTER_DESCRIPTION,
        user_guide: MOCK_FILE_URL,
        type: JobRequestType.IMAGE_POINTS,
        job_size: 10,
        max_time: 300,
      },
      validation: {
        min_quality: 1,
        val_size: 2,
        gt_url: '',
      },
      job_bounty: '1',
    };

    let uploadFilesMock: any;

    beforeEach(() => {
      uploadFilesMock = jest.spyOn(storageService, 'uploadFile');
    });

    beforeAll(() => {
      (KVStoreClient.build as any).mockImplementation(() => ({
        getPublicKey: jest.fn().mockResolvedValue(MOCK_PGP_PUBLIC_KEY),
      }));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should save the manifest and return the manifest URL and hash', async () => {
      uploadFilesMock.mockResolvedValue([
        {
          url: MOCK_FILE_URL,
          hash: MOCK_FILE_HASH,
        },
      ]);

      const result = await jobService.uploadManifest(
        JobRequestType.IMAGE_POINTS,
        chainId,
        manifest,
      );

      expect(result).toEqual([
        {
          hash: MOCK_FILE_HASH,
          url: MOCK_FILE_URL,
        },
      ]);

      expect(storageService.uploadFile).toHaveBeenCalled();
      expect(
        JSON.parse(
          await encryption.decrypt(
            (storageService.uploadFile as any).mock.calls[0][0],
          ),
        ),
      ).toEqual(manifest);
    });

    it('should throw an error if the manifest file fails to upload', async () => {
      const uploadError = new Error(ErrorBucket.UnableSaveFile);

      uploadFilesMock.mockRejectedValue(uploadError);

      await expect(
        jobService.uploadManifest(
          JobRequestType.IMAGE_POINTS,
          chainId,
          manifest,
        ),
      ).rejects.toThrowError(
        new BadGatewayException(ErrorBucket.UnableSaveFile),
      );

      expect(storageService.uploadFile).toHaveBeenCalled();
      expect(
        JSON.parse(
          await encryption.decrypt(
            (storageService.uploadFile as any).mock.calls[0][0],
          ),
        ),
      ).toEqual(manifest);
    });

    it('should rethrow any other errors encountered', async () => {
      const errorMessage = 'Something went wrong';
      const uploadError = new Error(errorMessage);

      uploadFilesMock.mockRejectedValue(uploadError);

      await expect(
        jobService.uploadManifest(
          JobRequestType.IMAGE_POINTS,
          chainId,
          manifest,
        ),
      ).rejects.toThrowError(new Error(errorMessage));
      expect(storageService.uploadFile).toHaveBeenCalled();
      expect(
        JSON.parse(
          await encryption.decrypt(
            (storageService.uploadFile as any).mock.calls[0][0],
          ),
        ),
      ).toEqual(manifest);
    });
  });

  describe('uploadManifest without encryption', () => {
    const chainId = ChainId.LOCALHOST;
    const fortuneManifestParams = {
      requestType: JobRequestType.FORTUNE,
      submissionsRequired: MOCK_SUBMISSION_REQUIRED,
      requesterDescription: MOCK_REQUESTER_DESCRIPTION,
      fundAmount: 10,
      requesterTitle: MOCK_REQUESTER_TITLE,
    };

    let uploadFilesMock: any;

    beforeEach(() => {
      uploadFilesMock = jest.spyOn(storageService, 'uploadFile');
    });

    beforeAll(() => {
      (KVStoreClient.build as any).mockImplementation(() => ({
        getPublicKey: jest.fn().mockResolvedValue(MOCK_PGP_PUBLIC_KEY),
      }));
      encrypt = false;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    afterAll(() => {
      encrypt = true;
    });

    it('should save the manifest and return the manifest URL and hash', async () => {
      uploadFilesMock.mockResolvedValue([
        {
          url: MOCK_FILE_URL,
          hash: MOCK_FILE_HASH,
        },
      ]);

      const result = await jobService.uploadManifest(
        JobRequestType.FORTUNE,
        chainId,
        fortuneManifestParams,
      );

      expect(result).toEqual([
        {
          url: MOCK_FILE_URL,
          hash: MOCK_FILE_HASH,
        },
      ]);

      expect(storageService.uploadFile).toHaveBeenCalled();
      expect((storageService.uploadFile as any).mock.calls[0][0]).toEqual(
        fortuneManifestParams,
      );
    });

    it('should throw an error if the manifest file fails to upload', async () => {
      const uploadError = new Error(ErrorBucket.UnableSaveFile);

      uploadFilesMock.mockRejectedValue(uploadError);

      await expect(
        jobService.uploadManifest(
          JobRequestType.FORTUNE,
          chainId,
          fortuneManifestParams,
        ),
      ).rejects.toThrowError(
        new BadGatewayException(ErrorBucket.UnableSaveFile),
      );

      expect(storageService.uploadFile).toHaveBeenCalled();
      expect((storageService.uploadFile as any).mock.calls[0][0]).toEqual(
        fortuneManifestParams,
      );
    });

    it('should rethrow any other errors encountered', async () => {
      const errorMessage = 'Something went wrong';
      const uploadError = new Error(errorMessage);

      uploadFilesMock.mockRejectedValue(uploadError);

      await expect(
        jobService.uploadManifest(
          JobRequestType.FORTUNE,
          chainId,
          fortuneManifestParams,
        ),
      ).rejects.toThrowError(new Error(errorMessage));

      expect(storageService.uploadFile).toHaveBeenCalled();
      expect((storageService.uploadFile as any).mock.calls[0][0]).toEqual(
        fortuneManifestParams,
      );
    });
  });

  describe('getResult', () => {
    let downloadFileFromUrlMock: any;

    beforeEach(() => {
      downloadFileFromUrlMock = storageService.download;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should download and return the fortune result', async () => {
      const jobEntityMock = {
        status: JobStatus.COMPLETED,
        fundAmount: 100,
        userId: 1,
        id: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        requestType: JobRequestType.FORTUNE,
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
      };

      jobRepository.findOneByIdAndUserId = jest
        .fn()
        .mockResolvedValue(jobEntityMock);

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
      downloadFileFromUrlMock.mockResolvedValueOnce(fortuneResult);

      const result = await jobService.getResult(MOCK_USER_ID, MOCK_JOB_ID);

      expect(storageService.download).toHaveBeenCalledWith(MOCK_FILE_URL);
      expect(storageService.download).toHaveBeenCalledTimes(1);
      expect(result).toEqual(fortuneResult);
    });

    it('should download and return the image binary result', async () => {
      const jobEntityMock = {
        status: JobStatus.COMPLETED,
        fundAmount: 100,
        userId: 1,
        id: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        requestType: JobRequestType.IMAGE_BOXES,
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
      };

      jobRepository.findOneByIdAndUserId = jest
        .fn()
        .mockResolvedValue(jobEntityMock);

      (EscrowClient.build as any).mockImplementation(() => ({
        getResultsUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
      }));

      const result = await jobService.getResult(MOCK_USER_ID, MOCK_JOB_ID);

      expect(result).toEqual(MOCK_FILE_URL);
    });

    it('should throw a NotFoundException if the result is not found', async () => {
      const jobEntityMock = {
        status: JobStatus.COMPLETED,
        fundAmount: 100,
        userId: 1,
        id: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        requestType: JobRequestType.FORTUNE,
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
      };

      jobRepository.findOneByIdAndUserId = jest
        .fn()
        .mockResolvedValue(jobEntityMock);

      downloadFileFromUrlMock.mockResolvedValueOnce(null);

      await expect(
        jobService.getResult(MOCK_USER_ID, MOCK_JOB_ID),
      ).rejects.toThrowError(new NotFoundException(ErrorJob.ResultNotFound));
      expect(storageService.download).toHaveBeenCalledWith(MOCK_FILE_URL);
      expect(storageService.download).toHaveBeenCalledTimes(1);
    });

    it('should throw a NotFoundException if the result is not valid', async () => {
      const jobEntityMock = {
        status: JobStatus.COMPLETED,
        fundAmount: 100,
        userId: 1,
        id: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        requestType: JobRequestType.FORTUNE,
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
      };

      jobRepository.findOneByIdAndUserId = jest
        .fn()
        .mockResolvedValue(jobEntityMock);

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
      downloadFileFromUrlMock.mockResolvedValueOnce(fortuneResult);

      await expect(
        jobService.getResult(MOCK_USER_ID, MOCK_JOB_ID),
      ).rejects.toThrowError(
        new NotFoundException(ErrorJob.ResultValidationFailed),
      );

      expect(storageService.download).toHaveBeenCalledWith(MOCK_FILE_URL);
      expect(storageService.download).toHaveBeenCalledTimes(1);
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
      expect(jobRepository.findByStatusFilter).toHaveBeenCalledWith(
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
      expect(jobRepository.findByStatusFilter).toHaveBeenCalledWith(
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
      jobRepository.findByEscrowAddresses = jest
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
      expect(jobRepository.findByEscrowAddresses).toHaveBeenCalledWith(userId, [
        MOCK_ADDRESS,
        MOCK_ADDRESS,
        MOCK_ADDRESS,
        MOCK_ADDRESS,
      ]);
    });
    it('should call the database with CANCELLED status', async () => {
      jobService.getJobsByStatus(
        [ChainId.LOCALHOST],
        userId,
        JobStatusFilter.PENDING,
        skip,
        limit,
      );
      expect(jobRepository.findByStatusFilter).toHaveBeenCalledWith(
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
        eventData: {
          reason: 'invalid manifest',
        },
      };

      await expect(jobService.escrowFailedWebhook(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if jobEntity is not found', async () => {
      const dto = {
        eventType: EventType.ESCROW_FAILED,
        chainId: 1,
        escrowAddress: 'address',
        reason: 'invalid manifest',
      };
      jobRepository.findOneByChainIdAndEscrowAddress = jest
        .fn()
        .mockResolvedValue(null);

      await expect(jobService.escrowFailedWebhook(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if jobEntity status is not LAUNCHED', async () => {
      const dto = {
        eventType: EventType.ESCROW_FAILED,
        chainId: 1,
        escrowAddress: 'address',
        eventData: {
          reason: 'invalid manifest',
        },
      };
      const mockJobEntity = {
        status: 'ANOTHER_STATUS' as JobStatus,
      };
      jobRepository.findOneByChainIdAndEscrowAddress = jest
        .fn()
        .mockResolvedValue(mockJobEntity);

      await expect(jobService.escrowFailedWebhook(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should update jobEntity status to FAILED and return true if all checks pass', async () => {
      const dto = {
        eventType: EventType.ESCROW_FAILED,
        chainId: 1,
        escrowAddress: 'address',
        eventData: {
          reason: 'invalid manifest',
        },
      };
      const mockJobEntity = {
        status: JobStatus.LAUNCHED,
        failedReason: dto.eventData.reason,
      };
      jobRepository.findOneByChainIdAndEscrowAddress = jest
        .fn()
        .mockResolvedValue(mockJobEntity);

      await jobService.escrowFailedWebhook(dto);

      expect(mockJobEntity.status).toBe(JobStatus.FAILED);
      expect(mockJobEntity.failedReason).toBe(dto.eventData.reason);
      expect(jobRepository.updateOne).toHaveBeenCalled();
    });
  });

  describe('getDetails', () => {
    it('should return job details with escrow address successfully', async () => {
      const balance = '1';
      const allocationMock: IAllocation = {
        escrowAddress: ethers.ZeroAddress,
        staker: ethers.ZeroAddress,
        tokens: 1n,
        createdAt: 1n,
        closedAt: 1n,
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
        requestType: JobRequestType.FORTUNE,
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
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

      jobRepository.findOneByIdAndUserId = jest
        .fn()
        .mockResolvedValue(jobEntityMock as any);
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
        requestType: JobRequestType.FORTUNE,
        escrowAddress: null,
        chainId: ChainId.LOCALHOST,
      };

      const expectedJobDetailsDto: JobDetailsDto = {
        details: {
          escrowAddress: ethers.ZeroAddress,
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
          tokenAddress: ethers.ZeroAddress,
          fundAmount: expect.any(Number),
          requesterAddress: MOCK_ADDRESS,
          requestType: JobRequestType.FORTUNE,
          exchangeOracleAddress: ethers.ZeroAddress,
          recordingOracleAddress: ethers.ZeroAddress,
          reputationOracleAddress: ethers.ZeroAddress,
        },
        staking: {
          staker: expect.any(String),
          allocated: 0,
          slashed: 0,
        },
      };

      jobRepository.findOneByIdAndUserId = jest
        .fn()
        .mockResolvedValue(jobEntityMock as any);
      storageService.download = jest.fn().mockResolvedValue(manifestMock);
      jobService.getPaidOutAmount = jest.fn().mockResolvedValue(10);

      const result = await jobService.getDetails(1, 123);
      expect(result).toMatchObject(expectedJobDetailsDto);
    });

    it('should throw not found exception when job not found', async () => {
      jobService.jobRepository.findOneByIdAndUserId = jest
        .fn()
        .mockResolvedValue(undefined);

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
        web3Service.getSigner(chainId).provider?.getLogs,
      ).toHaveBeenCalled();
    });
  });

  describe('getPaidOutAmount', () => {
    it('should calculate the paid out amount', async () => {
      const chainId = ChainId.LOCALHOST;
      const amount = ethers.parseEther('1.5');
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

      expect(Number(result)).toBe(MOCK_ORACLE_FEE);
      expect(typeof result).toBe('bigint');
    });
  });

  describe('escrowCompletedWebhook', () => {
    it('should throw NotFoundException if jobEntity is not found', async () => {
      const dto = {
        eventType: EventType.ESCROW_COMPLETED,
        chainId: 1,
        escrowAddress: 'address',
      };
      jobRepository.findOneByChainIdAndEscrowAddress = jest
        .fn()
        .mockResolvedValue(null);

      await expect(jobService.completeJob(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if jobEntity status is not LAUNCHED', async () => {
      const dto = {
        eventType: EventType.ESCROW_COMPLETED,
        chainId: 1,
        escrowAddress: 'address',
      };
      const mockJobEntity = {
        status: JobStatus.CANCELED,
      };
      jobRepository.findOneByChainIdAndEscrowAddress = jest
        .fn()
        .mockResolvedValue(mockJobEntity);

      await expect(jobService.completeJob(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should update jobEntity status to completed', async () => {
      const dto = {
        eventType: EventType.ESCROW_COMPLETED,
        chainId: 1,
        escrowAddress: 'address',
      };
      const mockJobEntity = {
        status: JobStatus.LAUNCHED,
      };

      jobRepository.findOneByChainIdAndEscrowAddress = jest
        .fn()
        .mockResolvedValue(mockJobEntity);

      await jobService.completeJob(dto);

      expect(mockJobEntity.status).toBe(JobStatus.COMPLETED);
      expect(jobRepository.updateOne).toHaveBeenCalled();
    });

    it('should not execute anything if status is already completed', async () => {
      const dto = {
        eventType: EventType.ESCROW_COMPLETED,
        chainId: 1,
        escrowAddress: 'address',
      };
      const mockJobEntity = {
        status: JobStatus.COMPLETED,
      };

      jobRepository.findOneByChainIdAndEscrowAddress = jest
        .fn()
        .mockResolvedValue(mockJobEntity);

      await jobService.completeJob(dto);

      expect(mockJobEntity.status).toBe(JobStatus.COMPLETED);
      expect(jobRepository.updateOne).not.toHaveBeenCalled();
    });
  });
});
