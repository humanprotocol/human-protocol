/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createMock } from '@golevelup/ts-jest';
import {
  ChainId,
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  Encryption,
  KVStoreUtils,
} from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  ErrorBucket,
  ErrorEscrow,
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
  JobCurrency,
  JobRequestType,
  JobStatus,
  JobStatusFilter,
  WorkerBrowser,
  WorkerLanguage,
  Country,
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
  MOCK_JOB_ID,
  MOCK_JOB_LAUNCHER_FEE,
  MOCK_PGP_PRIVATE_KEY,
  MOCK_PGP_PUBLIC_KEY,
  MOCK_REQUESTER_DESCRIPTION,
  MOCK_REQUESTER_TITLE,
  MOCK_SUBMISSION_REQUIRED,
  MOCK_TRANSACTION_HASH,
  MOCK_USER_ID,
  MOCK_STORAGE_DATA,
  MOCK_CVAT_DATA_DATASET,
  MOCK_CVAT_LABELS,
  MOCK_HCAPTCHA_SITE_KEY,
  MOCK_HCAPTCHA_IMAGE_LABEL,
  MOCK_HCAPTCHA_IMAGE_URL,
  MOCK_RECORDING_ORACLE_URL,
  MOCK_BUCKET_FILE,
  MOCK_CVAT_LABELS_WITH_NODES,
  MOCK_CVAT_DATA_POINTS,
  MOCK_CVAT_DATA_BOXES,
  MOCK_CVAT_DATA,
  MOCK_CVAT_GT,
  MOCK_REPUTATION_ORACLE_URL,
  mockConfig,
} from '../../../test/constants';
import { PaymentService } from '../payment/payment.service';
import { Web3Service } from '../web3/web3.service';
import {
  FortuneFinalResultDto,
  FortuneManifestDto,
  JobFortuneDto,
  JobCvatDto,
  JobDetailsDto,
  JobCaptchaDto,
  CvatManifestDto,
  JobQuickLaunchDto,
} from './job.dto';
import { JobEntity } from './job.entity';
import { JobRepository } from './job.repository';
import { WebhookRepository } from '../webhook/webhook.repository';
import { JobService } from './job.service';

import { add, div, mul } from '../../common/utils/decimal';
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
import { ServerConfigService } from '../../common/config/server-config.service';
import { AuthConfigService } from '../../common/config/auth-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { CvatConfigService } from '../../common/config/cvat-config.service';
import { PGPConfigService } from '../../common/config/pgp-config.service';
import { S3ConfigService } from '../../common/config/s3-config.service';
import { CvatCalculateJobBounty } from './job.interface';
import { listObjectsInBucket } from '../../common/utils/storage';
import { ControlledError } from '../../common/errors/controlled';
import { RateService } from '../payment/rate.service';
import { CronJobRepository } from '../cron-job/cron-job.repository';
import { CronJobType } from '../../common/enums/cron-job';
import { QualificationService } from '../qualification/qualification.service';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { WhitelistService } from '../whitelist/whitelist.service';

const rate = 1.5;
jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn().mockImplementation(() => ({
      createEscrow: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      setup: jest.fn().mockResolvedValue(null),
      fund: jest.fn().mockResolvedValue(null),
      getBalance: jest.fn(),
    })),
  },
  EscrowUtils: {
    getEscrow: jest.fn(),
  },
  StakingClient: {
    build: jest.fn().mockImplementation(() => ({
      getAllocation: jest.fn(),
    })),
  },
  KVStoreUtils: {
    get: jest.fn(),
    getPublicKey: jest.fn(),
  },
}));

jest.mock('../../common/utils', () => ({
  ...jest.requireActual('../../common/utils'),
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
    whitelistService: WhitelistService,
    encryption: Encryption,
    storageService: StorageService,
    webhookRepository: WebhookRepository,
    cronJobRepository: CronJobRepository;

  let encrypt = true;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  const selectedOraclesMock = {
    reputationOracle: '0xReputationOracle',
    exchangeOracle: '0xExchangeOracle',
    recordingOracle: '0xRecordingOracle',
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'PGP_ENCRYPT') return encrypt;
              return mockConfig[key];
            }),
            getOrThrow: jest.fn((key: string) => {
              if (!mockConfig[key]) {
                throw new Error(`Configuration key "${key}" does not exist`);
              }
              if (key === 'PGP_ENCRYPT') return encrypt;
              return mockConfig[key];
            }),
          },
        },
        JobService,
        Encryption,
        ServerConfigService,
        AuthConfigService,
        Web3ConfigService,
        CvatConfigService,
        PGPConfigService,
        S3ConfigService,
        QualificationService,
        NetworkConfigService,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
            validateChainId: jest.fn().mockReturnValue(new Error()),
            calculateGasPrice: jest.fn().mockReturnValue(1000n),
            getOperatorAddress: jest.fn().mockReturnValue(MOCK_ADDRESS),
          },
        },
        {
          provide: RateService,
          useValue: {
            getRate: jest.fn().mockResolvedValue(rate),
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
        {
          provide: CronJobRepository,
          useValue: {
            findOneByType: jest.fn(),
          },
        },
        { provide: PaymentService, useValue: createMock<PaymentService>() },
        { provide: HttpService, useValue: createMock<HttpService>() },
        { provide: StorageService, useValue: createMock<StorageService>() },
        { provide: WebhookService, useValue: createMock<WebhookService>() },
        { provide: WhitelistService, useValue: createMock<WhitelistService>() },
        {
          provide: RoutingProtocolService,
          useValue: {
            selectNetwork: jest.fn().mockReturnValue(ChainId.POLYGON_AMOY),
            selectOracles: jest.fn().mockReturnValue(selectedOraclesMock),
            validateOracles: jest.fn(),
          },
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
    cronJobRepository = moduleRef.get<CronJobRepository>(CronJobRepository);
    paymentService = moduleRef.get(PaymentService);
    routingProtocolService = moduleRef.get(RoutingProtocolService);
    createPaymentMock = jest.spyOn(paymentRepository, 'createUnique');
    web3Service = moduleRef.get<Web3Service>(Web3Service);
    webhookRepository = moduleRef.get<WebhookRepository>(WebhookRepository);
    storageService = moduleRef.get<StorageService>(StorageService);
    whitelistService = moduleRef.get<WhitelistService>(WhitelistService);

    (jobService as any).cronJobRepository = cronJobRepository;

    storageService.uploadJsonLikeData = jest.fn().mockResolvedValue({
      url: MOCK_FILE_URL,
      hash: MOCK_FILE_HASH,
    });

    storageService.downloadJsonLikeData = jest.fn();
    storageService.downloadFile = jest.fn();

    encryption = await Encryption.build(MOCK_PGP_PRIVATE_KEY);
  });

  describe('createJob', () => {
    const jobId = 123;
    const fortuneJobDto: JobFortuneDto = {
      chainId: MOCK_CHAIN_ID,
      submissionsRequired: MOCK_SUBMISSION_REQUIRED,
      requesterTitle: MOCK_REQUESTER_TITLE,
      requesterDescription: MOCK_REQUESTER_DESCRIPTION,
      fundAmount: 10,
      currency: JobCurrency.HMT,
    };

    const userMock: any = {
      id: 1,
      stripeCustomerId: 'stripeTest',
    };

    let getUserBalanceMock: any;

    beforeEach(() => {
      getUserBalanceMock = jest.spyOn(paymentService, 'getUserBalance');
      createPaymentMock.mockResolvedValue(true);
      jest.spyOn(whitelistService, 'isUserWhitelisted').mockResolvedValue(true);
      jest
        .spyOn(paymentService, 'getDefaultPaymentMethod')
        .mockResolvedValue('test_card_id');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should use all oracles provided by the user and skip oracle selection', async () => {
      const fundAmount = 10;
      const userBalance = 25;

      const providedReputationOracle = '0xProvidedReputationOracle';
      const providedExchangeOracle = '0xProvidedExchangeOracle';
      const providedRecordingOracle = '0xProvidedRecordingOracle';

      const fortuneJobDto: JobFortuneDto = {
        chainId: MOCK_CHAIN_ID,
        submissionsRequired: MOCK_SUBMISSION_REQUIRED,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: fundAmount,
        currency: JobCurrency.HMT,
        reputationOracle: providedReputationOracle,
        exchangeOracle: providedExchangeOracle,
        recordingOracle: providedRecordingOracle,
      };

      getUserBalanceMock.mockResolvedValue(userBalance);
      KVStoreUtils.get = jest.fn().mockResolvedValue(MOCK_ORACLE_FEE);
      KVStoreUtils.getPublicKey = jest
        .fn()
        .mockResolvedValue(MOCK_PGP_PUBLIC_KEY);

      await jobService.createJob(
        userMock,
        JobRequestType.FORTUNE,
        fortuneJobDto,
      );

      expect(routingProtocolService.validateOracles).toHaveBeenCalledWith(
        MOCK_CHAIN_ID,
        JobRequestType.FORTUNE,
        providedReputationOracle,
        providedExchangeOracle,
        providedRecordingOracle,
      );

      expect(jobRepository.createUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          reputationOracle: providedReputationOracle,
          exchangeOracle: providedExchangeOracle,
          recordingOracle: providedRecordingOracle,
        }),
      );
    });

    it('should select missing oracles when only partial oracles are provided by the user', async () => {
      const fundAmount = 10;
      const userBalance = 25;

      const providedReputationOracle = '0xProvidedReputationOracle';
      const providedExchangeOracle = '0xProvidedExchangeOracle';

      const fortuneJobDto: JobFortuneDto = {
        chainId: MOCK_CHAIN_ID,
        submissionsRequired: MOCK_SUBMISSION_REQUIRED,
        requesterTitle: MOCK_REQUESTER_TITLE,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        fundAmount: fundAmount,
        currency: JobCurrency.HMT,
        reputationOracle: providedReputationOracle,
        exchangeOracle: providedExchangeOracle,
      };

      getUserBalanceMock.mockResolvedValue(userBalance);
      KVStoreUtils.get = jest.fn().mockResolvedValue(MOCK_ORACLE_FEE);
      KVStoreUtils.getPublicKey = jest
        .fn()
        .mockResolvedValue(MOCK_PGP_PUBLIC_KEY);

      jest.spyOn(routingProtocolService, 'selectOracles').mockResolvedValue({
        reputationOracle: selectedOraclesMock.reputationOracle,
        exchangeOracle: selectedOraclesMock.exchangeOracle,
        recordingOracle: selectedOraclesMock.recordingOracle,
      });

      await jobService.createJob(
        userMock,
        JobRequestType.FORTUNE,
        fortuneJobDto,
      );

      expect(routingProtocolService.selectOracles).toHaveBeenCalledTimes(1);

      expect(jobRepository.createUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          reputationOracle: providedReputationOracle,
          exchangeOracle: providedExchangeOracle,
          recordingOracle: selectedOraclesMock.recordingOracle,
        }),
      );
    });

    it('should create a job successfully if user is whitelisted', async () => {
      const fundAmount = 10;
      const fee = (MOCK_JOB_LAUNCHER_FEE / 100) * fundAmount;

      const userBalance = 25;
      getUserBalanceMock.mockResolvedValue(userBalance);

      const mockJobEntity: Partial<JobEntity> = {
        id: jobId,
        userId: userMock.id,
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

      KVStoreUtils.get = jest.fn().mockResolvedValue(MOCK_ORACLE_FEE);
      KVStoreUtils.getPublicKey = jest
        .fn()
        .mockResolvedValue(MOCK_PGP_PUBLIC_KEY);

      jobRepository.createUnique = jest.fn().mockResolvedValue(mockJobEntity);

      await jobService.createJob(
        userMock,
        JobRequestType.FORTUNE,
        fortuneJobDto,
      );

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(
        userMock.id,
        div(1, rate),
      );
      expect(paymentRepository.createUnique).toHaveBeenCalledWith({
        userId: userMock.id,
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
        userId: userMock.id,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        requestType: JobRequestType.FORTUNE,
        fee: mul(fee, rate),
        fundAmount: mul(fundAmount, rate),
        status: JobStatus.PENDING,
        waitUntil: expect.any(Date),
        ...selectedOraclesMock,
      });
    });

    it('should create a job using quick launch successfully', async () => {
      const tokenFundAmount = 100;
      const tokenFee = (MOCK_JOB_LAUNCHER_FEE / 100) * tokenFundAmount;
      const tokenTotalAmount = add(tokenFundAmount, tokenFee);

      const userBalance = 250;
      getUserBalanceMock.mockResolvedValue(userBalance);

      const mockJobEntity: Partial<JobEntity> = {
        id: jobId,
        userId: userMock.id,
        chainId: ChainId.LOCALHOST,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        requestType: JobRequestType.HCAPTCHA,
        escrowAddress: MOCK_ADDRESS,
        fee: tokenFee,
        fundAmount: tokenFundAmount,
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      KVStoreUtils.get = jest.fn().mockResolvedValue(MOCK_ORACLE_FEE);
      KVStoreUtils.getPublicKey = jest
        .fn()
        .mockResolvedValue(MOCK_PGP_PUBLIC_KEY);

      jobRepository.createUnique = jest.fn().mockResolvedValue(mockJobEntity);

      // Create a quick launch payload
      const quickLaunchJobDto = new JobQuickLaunchDto();
      quickLaunchJobDto.chainId = MOCK_CHAIN_ID;
      quickLaunchJobDto.requestType = JobRequestType.HCAPTCHA;
      quickLaunchJobDto.manifestUrl = MOCK_FILE_URL;
      quickLaunchJobDto.manifestHash = MOCK_FILE_HASH;
      quickLaunchJobDto.fundAmount = tokenFundAmount;

      await jobService.createJob(
        userMock,
        JobRequestType.HCAPTCHA,
        quickLaunchJobDto,
      );

      // Methods won't be invoked as the quick launch call includes a manifest data.
      jobService.createHCaptchaManifest = jest.fn();
      jobService.uploadManifest = jest.fn();
      expect(jobService.createHCaptchaManifest).toHaveBeenCalledTimes(0);
      expect(jobService.uploadManifest).toHaveBeenCalledTimes(0);

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(
        userMock.id,
        div(1, rate),
      );
      expect(paymentRepository.createUnique).toHaveBeenCalledWith({
        userId: userMock.id,
        jobId,
        source: PaymentSource.BALANCE,
        type: PaymentType.WITHDRAWAL,
        currency: TokenId.HMT,
        amount: -tokenTotalAmount,
        rate: div(1, rate),
        status: PaymentStatus.SUCCEEDED,
      });
      expect(jobRepository.createUnique).toHaveBeenCalledWith({
        chainId: quickLaunchJobDto.chainId,
        userId: userMock.id,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        requestType: JobRequestType.HCAPTCHA,
        fee: tokenFee,
        fundAmount: tokenFundAmount,
        status: JobStatus.PENDING,
        waitUntil: expect.any(Date),
        ...selectedOraclesMock,
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

      KVStoreUtils.get = jest.fn().mockResolvedValue(MOCK_ORACLE_FEE);
      KVStoreUtils.getPublicKey = jest
        .fn()
        .mockResolvedValue(MOCK_PGP_PUBLIC_KEY);

      await jobService.createJob(userMock, JobRequestType.FORTUNE, {
        ...fortuneJobDto,
        chainId: undefined,
      });

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(
        userMock.id,
        div(1, rate),
      );
      expect(jobRepository.createUnique).toHaveBeenCalledWith({
        chainId: ChainId.MOONBEAM,
        userId: userMock.id,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        requestType: JobRequestType.FORTUNE,
        fee: mul(fee, rate),
        fundAmount: mul(fundAmount, rate),
        status: JobStatus.PENDING,
        waitUntil: expect.any(Date),
        ...selectedOraclesMock,
      });
    });

    it('should throw an exception for invalid chain id provided', async () => {
      web3Service.validateChainId = jest.fn(() => {
        throw new ControlledError(
          ErrorWeb3.InvalidChainId,
          HttpStatus.BAD_REQUEST,
        );
      });

      await expect(
        jobService.createJob(userMock, JobRequestType.FORTUNE, fortuneJobDto),
      ).rejects.toThrow(
        new ControlledError(ErrorWeb3.InvalidChainId, HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw an exception for insufficient user balance', async () => {
      const userBalance = 1;
      jest
        .spyOn(paymentService, 'getUserBalance')
        .mockResolvedValue(userBalance);

      KVStoreUtils.get = jest.fn().mockResolvedValue(MOCK_ORACLE_FEE);

      getUserBalanceMock.mockResolvedValue(userBalance);

      await expect(
        jobService.createJob(userMock, JobRequestType.FORTUNE, fortuneJobDto),
      ).rejects.toThrow(
        new ControlledError(ErrorJob.NotEnoughFunds, HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw an exception if user is not whitelisted and does not have any active card', async () => {
      jest
        .spyOn(whitelistService, 'isUserWhitelisted')
        .mockResolvedValueOnce(false);
      jest
        .spyOn(paymentService, 'getDefaultPaymentMethod')
        .mockResolvedValueOnce(null);

      await expect(
        jobService.createJob(userMock, JobRequestType.FORTUNE, fortuneJobDto),
      ).rejects.toThrow(
        new ControlledError(ErrorJob.NotActiveCard, HttpStatus.BAD_REQUEST),
      );
    });

    it('should create a job successfully if user is not whitelisted but has an active card', async () => {
      const fundAmount = 10;
      const fee = (MOCK_JOB_LAUNCHER_FEE / 100) * fundAmount;

      const userBalance = 25;
      getUserBalanceMock.mockResolvedValue(userBalance);

      const mockJobEntity: Partial<JobEntity> = {
        id: jobId,
        userId: userMock.id,
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

      KVStoreUtils.get = jest.fn().mockResolvedValue(MOCK_ORACLE_FEE);
      KVStoreUtils.getPublicKey = jest
        .fn()
        .mockResolvedValue(MOCK_PGP_PUBLIC_KEY);

      jobRepository.createUnique = jest.fn().mockResolvedValue(mockJobEntity);
      jest
        .spyOn(whitelistService, 'isUserWhitelisted')
        .mockResolvedValueOnce(false);
      jest
        .spyOn(paymentService, 'getDefaultPaymentMethod')
        .mockResolvedValueOnce('test_card_id');

      await jobService.createJob(
        userMock,
        JobRequestType.FORTUNE,
        fortuneJobDto,
      );

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(
        userMock.id,
        div(1, rate),
      );
      expect(paymentRepository.createUnique).toHaveBeenCalledWith({
        userId: userMock.id,
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
        userId: userMock.id,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        requestType: JobRequestType.FORTUNE,
        fee: mul(fee, rate),
        fundAmount: mul(fundAmount, rate),
        status: JobStatus.PENDING,
        waitUntil: expect.any(Date),
        ...selectedOraclesMock,
      });
    });
  });

  describe('getCvatElementsCount', () => {
    it('should calculate the number of CVAT elements correctly', async () => {
      const gtUrl = new URL('http://some-gt-url.com');
      const dataUrl = new URL('http://some-data-url.com');
      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValueOnce(MOCK_CVAT_DATA)
        .mockResolvedValueOnce(MOCK_CVAT_GT);

      const result = await jobService.getCvatElementsCount(gtUrl, dataUrl);
      expect(result).toBe(2);
    });
  });

  describe('createCvatManifest', () => {
    it('should create a valid CVAT manifest for image boxes job type', async () => {
      const jobBounty = '100';
      jest
        .spyOn(jobService, 'calculateJobBounty')
        .mockResolvedValueOnce(jobBounty);

      const dto: JobCvatDto = {
        data: MOCK_CVAT_DATA_DATASET,
        labels: MOCK_CVAT_LABELS,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        userGuide: MOCK_FILE_URL,
        minQuality: 0.8,
        groundTruth: MOCK_STORAGE_DATA,
        type: JobRequestType.IMAGE_BOXES,
        fundAmount: 10,
        currency: JobCurrency.HMT,
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
          labels: MOCK_CVAT_LABELS,
          description: MOCK_REQUESTER_DESCRIPTION,
          user_guide: MOCK_FILE_URL,
          type: requestType,
          job_size: 1,
        },
        validation: {
          min_quality: 0.8,
          val_size: 2,
          gt_url: MOCK_BUCKET_FILE,
        },
        job_bounty: jobBounty,
      });
    });

    it('should create a valid CVAT manifest for image polygons job type', async () => {
      const jobBounty = '100';
      jest
        .spyOn(jobService, 'calculateJobBounty')
        .mockResolvedValueOnce(jobBounty);

      const dto: JobCvatDto = {
        data: MOCK_CVAT_DATA_DATASET,
        labels: MOCK_CVAT_LABELS,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        userGuide: MOCK_FILE_URL,
        minQuality: 0.8,
        groundTruth: MOCK_STORAGE_DATA,
        type: JobRequestType.IMAGE_POLYGONS,
        fundAmount: 10,
        currency: JobCurrency.HMT,
      };

      const requestType = JobRequestType.IMAGE_POLYGONS;
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
          labels: MOCK_CVAT_LABELS,
          description: MOCK_REQUESTER_DESCRIPTION,
          user_guide: MOCK_FILE_URL,
          type: requestType,
          job_size: 1,
        },
        validation: {
          min_quality: 0.8,
          val_size: 2,
          gt_url: MOCK_BUCKET_FILE,
        },
        job_bounty: jobBounty,
      });
    });

    it('should create a valid CVAT manifest for image boxes from points job type', async () => {
      const jobBounty = '50.0';

      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValueOnce(MOCK_CVAT_DATA)
        .mockResolvedValueOnce(MOCK_CVAT_GT);

      const dto: JobCvatDto = {
        data: MOCK_CVAT_DATA_POINTS,
        labels: MOCK_CVAT_LABELS,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        userGuide: MOCK_FILE_URL,
        minQuality: 0.8,
        groundTruth: MOCK_STORAGE_DATA,
        type: JobRequestType.IMAGE_BOXES_FROM_POINTS,
        fundAmount: 10,
        currency: JobCurrency.HMT,
      };

      const requestType = JobRequestType.IMAGE_BOXES_FROM_POINTS;
      const tokenFundAmount = 100;

      const result = await jobService.createCvatManifest(
        dto,
        requestType,
        tokenFundAmount,
      );

      expect(result).toEqual({
        data: {
          data_url: MOCK_BUCKET_FILE,
          points_url: MOCK_BUCKET_FILE,
        },
        annotation: {
          labels: MOCK_CVAT_LABELS,
          description: MOCK_REQUESTER_DESCRIPTION,
          user_guide: MOCK_FILE_URL,
          type: requestType,
          job_size: 1,
        },
        validation: {
          min_quality: 0.8,
          val_size: 2,
          gt_url: MOCK_BUCKET_FILE,
        },
        job_bounty: jobBounty,
      });
    });

    it('should create a valid CVAT manifest for image skeletons from boxes job type', async () => {
      const jobBounty = '4.0';

      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValueOnce(MOCK_CVAT_DATA)
        .mockResolvedValueOnce(MOCK_CVAT_GT);

      const dto: JobCvatDto = {
        data: MOCK_CVAT_DATA_BOXES,
        labels: MOCK_CVAT_LABELS_WITH_NODES,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        userGuide: MOCK_FILE_URL,
        minQuality: 0.8,
        groundTruth: MOCK_STORAGE_DATA,
        type: JobRequestType.IMAGE_SKELETONS_FROM_BOXES,
        fundAmount: 10,
        currency: JobCurrency.HMT,
      };

      const requestType = JobRequestType.IMAGE_SKELETONS_FROM_BOXES;
      const tokenFundAmount = 16;

      const result = await jobService.createCvatManifest(
        dto,
        requestType,
        tokenFundAmount,
      );

      expect(result).toEqual({
        data: {
          data_url: MOCK_BUCKET_FILE,
          boxes_url: MOCK_BUCKET_FILE,
        },
        annotation: {
          labels: MOCK_CVAT_LABELS_WITH_NODES,
          description: MOCK_REQUESTER_DESCRIPTION,
          user_guide: MOCK_FILE_URL,
          type: requestType,
          job_size: 1,
        },
        validation: {
          min_quality: 0.8,
          val_size: 2,
          gt_url: MOCK_BUCKET_FILE,
        },
        job_bounty: jobBounty,
      });
    });

    it('should throw an error data not exist for image boxes from points job type', async () => {
      const requestType = JobRequestType.IMAGE_BOXES_FROM_POINTS;

      const dto: JobCvatDto = {
        data: MOCK_CVAT_DATA_DATASET, // Data without points
        labels: MOCK_CVAT_LABELS,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        userGuide: MOCK_FILE_URL,
        minQuality: 0.8,
        groundTruth: MOCK_STORAGE_DATA,
        type: requestType,
        fundAmount: 10,
        currency: JobCurrency.HMT,
      };

      const tokenFundAmount = 100;

      expect(
        jobService.createCvatManifest(dto, requestType, tokenFundAmount),
      ).rejects.toThrow(
        new ControlledError(ErrorJob.DataNotExist, HttpStatus.CONFLICT),
      );
    });

    it('should throw an error data not exist for image skeletons from boxes job type', async () => {
      const requestType = JobRequestType.IMAGE_BOXES_FROM_POINTS;

      const dto: JobCvatDto = {
        data: MOCK_CVAT_DATA_DATASET, // Data without points
        labels: MOCK_CVAT_LABELS,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        userGuide: MOCK_FILE_URL,
        minQuality: 0.8,
        groundTruth: MOCK_STORAGE_DATA,
        type: requestType,
        fundAmount: 10,
        currency: JobCurrency.HMT,
      };

      const tokenFundAmount = 100;

      expect(
        jobService.createCvatManifest(dto, requestType, tokenFundAmount),
      ).rejects.toThrow(
        new ControlledError(ErrorJob.DataNotExist, HttpStatus.CONFLICT),
      );
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
      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValueOnce(fileContent);

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
        repo_uri: MOCK_REPUTATION_ORACLE_URL,
        ro_uri: MOCK_RECORDING_ORACLE_URL,
        request_type: JobCaptchaRequestType.IMAGE_LABEL_BINARY,
        groundtruth_uri: MOCK_FILE_URL,
        requester_restricted_answer_set: {},
        requester_question_example: MOCK_BUCKET_FILES,
      });
    });

    it('should create a valid HCaptcha manifest for CATEGORIZATION job type', async () => {
      const fileContent = {
        [MOCK_HCAPTCHA_IMAGE_URL]: [[MOCK_HCAPTCHA_IMAGE_LABEL]],
      };
      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValueOnce(fileContent);

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
        repo_uri: MOCK_REPUTATION_ORACLE_URL,
        ro_uri: MOCK_RECORDING_ORACLE_URL,
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
      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValueOnce(fileContent);

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
        repo_uri: MOCK_REPUTATION_ORACLE_URL,
        ro_uri: MOCK_RECORDING_ORACLE_URL,
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
      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValueOnce(fileContent);

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
        repo_uri: MOCK_REPUTATION_ORACLE_URL,
        ro_uri: MOCK_RECORDING_ORACLE_URL,
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
      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValueOnce(fileContent);

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
        repo_uri: MOCK_REPUTATION_ORACLE_URL,
        ro_uri: MOCK_RECORDING_ORACLE_URL,
        request_type: JobCaptchaRequestType.IMAGE_LABEL_AREA_SELECT,
        groundtruth_uri: MOCK_FILE_URL,
        requester_restricted_answer_set: {
          [MOCK_HCAPTCHA_IMAGE_LABEL]: { en: MOCK_HCAPTCHA_IMAGE_LABEL },
        },
        requester_question_example: MOCK_BUCKET_FILES,
      });
    });

    it('should throw ControlledError for invalid POLYGON job type without label', async () => {
      const fileContent = JSON.stringify({
        [MOCK_HCAPTCHA_IMAGE_URL]: [[MOCK_HCAPTCHA_IMAGE_LABEL]],
      });
      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValueOnce(fileContent);

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

      await expect(jobService.createHCaptchaManifest(jobDto)).rejects.toThrow(
        new ControlledError(
          ErrorJob.JobParamsValidationFailed,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('calculateJobBounty', () => {
    it('should calculate the job bounty correctly for image boxes from points type', async () => {
      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValueOnce(MOCK_CVAT_DATA)
        .mockResolvedValueOnce(MOCK_CVAT_GT);

      const data: CvatCalculateJobBounty = {
        requestType: JobRequestType.IMAGE_BOXES_FROM_POINTS,
        fundAmount: 22.918128652290278,
        urls: {
          dataUrl: new URL(MOCK_FILE_URL),
          gtUrl: new URL(MOCK_FILE_URL),
          pointsUrl: new URL(MOCK_FILE_URL),
        },
      };

      const result = await jobService.calculateJobBounty(data); //  elementsCount = 2

      expect(result).toEqual('11.459064326145139');
    });

    it('should calculate the job bounty correctly for image skeletons from boxed type', async () => {
      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValueOnce(MOCK_CVAT_DATA)
        .mockResolvedValueOnce(MOCK_CVAT_GT);

      const data = {
        requestType: JobRequestType.IMAGE_SKELETONS_FROM_BOXES,
        fundAmount: 22.918128652290278,
        urls: {
          dataUrl: new URL(MOCK_FILE_URL),
          gtUrl: new URL(MOCK_FILE_URL),
          boxesUrl: new URL(MOCK_FILE_URL),
        },
        nodesTotal: 4,
      };

      const result = await jobService.calculateJobBounty(data); //  elementsCount = 2

      expect(result).toEqual('5.7295321630725695');
    });
  });

  describe('createJob with image label binary type', () => {
    const jobId = 123;
    const userMock: any = {
      id: 1,
      stripeCustomerId: 'stripeTest',
    };

    const imageLabelBinaryJobDto: JobCvatDto = {
      chainId: MOCK_CHAIN_ID,
      data: MOCK_CVAT_DATA_DATASET,
      labels: MOCK_CVAT_LABELS,
      requesterDescription: MOCK_REQUESTER_DESCRIPTION,
      minQuality: 0.95,
      fundAmount: 10,
      groundTruth: MOCK_STORAGE_DATA,
      userGuide: MOCK_FILE_URL,
      type: JobRequestType.IMAGE_POINTS,
      currency: JobCurrency.HMT,
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
        userId: userMock.id,
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

      KVStoreUtils.get = jest.fn().mockResolvedValue(MOCK_ORACLE_FEE);
      KVStoreUtils.getPublicKey = jest
        .fn()
        .mockResolvedValue(MOCK_PGP_PUBLIC_KEY);

      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValueOnce(MOCK_CVAT_GT);

      (listObjectsInBucket as any).mockResolvedValueOnce([
        '1.jpg',
        '2.jpg',
        '3.jpg',
        '4.jpg',
        '5.jpg',
      ]);

      await jobService.createJob(
        userMock,
        JobRequestType.IMAGE_POINTS,
        imageLabelBinaryJobDto,
      );

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(
        userMock.id,
        div(1, rate),
      );
      expect(paymentRepository.createUnique).toHaveBeenCalledWith({
        userId: userMock.id,
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
        userId: userMock.id,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        requestType: JobRequestType.IMAGE_POINTS,
        fee: mul(fee, rate),
        fundAmount: mul(fundAmount, rate),
        status: JobStatus.PENDING,
        waitUntil: expect.any(Date),
        ...selectedOraclesMock,
      });
    });

    it('should throw an error for invalid storage provider', async () => {
      const userBalance = 25;
      getUserBalanceMock.mockResolvedValue(userBalance);

      const storageDatasetMock: any = {
        dataset: {
          provider: StorageProviders.GCS,
          region: AWSRegions.EU_CENTRAL_1,
          bucketName: 'bucket',
          path: 'folder/test',
        },
      };

      const storageGtMock: any = {
        provider: StorageProviders.GCS,
        region: AWSRegions.EU_CENTRAL_1,
        bucketName: 'bucket',
        path: 'folder/test',
      };

      const imageLabelBinaryJobDto: JobCvatDto = {
        chainId: MOCK_CHAIN_ID,
        data: storageDatasetMock,
        labels: MOCK_CVAT_LABELS,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        minQuality: 0.95,
        fundAmount: 10,
        groundTruth: storageGtMock,
        userGuide: MOCK_FILE_URL,
        type: JobRequestType.IMAGE_POINTS,
        currency: JobCurrency.HMT,
      };

      KVStoreUtils.get = jest.fn().mockResolvedValue(MOCK_ORACLE_FEE);

      await expect(
        jobService.createJob(
          userMock,
          JobRequestType.IMAGE_POINTS,
          imageLabelBinaryJobDto,
        ),
      ).rejects.toThrow(
        new ControlledError(
          ErrorBucket.InvalidProvider,
          HttpStatus.BAD_REQUEST,
        ),
      );

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(
        userMock.id,
        div(1, rate),
      );
    });

    it('should throw an error for invalid region', async () => {
      const userBalance = 25;
      getUserBalanceMock.mockResolvedValue(userBalance);

      const storageDatasetMock: any = {
        dataset: {
          provider: StorageProviders.AWS,
          region: 'test-region',
          bucketName: 'bucket',
          path: 'folder/test',
        },
      };

      const storageGtMock: any = {
        provider: StorageProviders.AWS,
        region: 'test-region',
        bucketName: 'bucket',
        path: 'folder/test',
      };

      const imageLabelBinaryJobDto: JobCvatDto = {
        chainId: MOCK_CHAIN_ID,
        data: storageDatasetMock,
        labels: MOCK_CVAT_LABELS,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        minQuality: 0.95,
        fundAmount: 10,
        groundTruth: storageGtMock,
        userGuide: MOCK_FILE_URL,
        type: JobRequestType.IMAGE_POINTS,
        currency: JobCurrency.HMT,
      };

      KVStoreUtils.get = jest.fn().mockResolvedValue(MOCK_ORACLE_FEE);

      await expect(
        jobService.createJob(
          userMock,
          JobRequestType.IMAGE_POINTS,
          imageLabelBinaryJobDto,
        ),
      ).rejects.toThrow(
        new ControlledError(ErrorBucket.InvalidRegion, HttpStatus.BAD_REQUEST),
      );

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(
        userMock.id,
        div(1, rate),
      );
    });

    it('should throw an error for empty region', async () => {
      const userBalance = 25;
      getUserBalanceMock.mockResolvedValue(userBalance);

      const storageDatasetMock: any = {
        dataset: {
          provider: StorageProviders.AWS,
          bucketName: 'bucket',
          path: 'folder/test',
        },
      };

      const storageGtMock: any = {
        provider: StorageProviders.AWS,
        bucketName: 'bucket',
        path: 'folder/test',
      };

      const imageLabelBinaryJobDto: JobCvatDto = {
        chainId: MOCK_CHAIN_ID,
        data: storageDatasetMock,
        labels: MOCK_CVAT_LABELS,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        minQuality: 0.95,
        fundAmount: 10,
        groundTruth: storageGtMock,
        userGuide: MOCK_FILE_URL,
        type: JobRequestType.IMAGE_POINTS,
        currency: JobCurrency.HMT,
      };

      KVStoreUtils.get = jest.fn().mockResolvedValue(MOCK_ORACLE_FEE);

      await expect(
        jobService.createJob(
          userMock,
          JobRequestType.IMAGE_POINTS,
          imageLabelBinaryJobDto,
        ),
      ).rejects.toThrow(
        new ControlledError(ErrorBucket.EmptyRegion, HttpStatus.BAD_REQUEST),
      );

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(
        userMock.id,
        div(1, rate),
      );
    });

    it('should throw an error for empty bucket', async () => {
      const userBalance = 25;
      getUserBalanceMock.mockResolvedValue(userBalance);

      const storageDatasetMock: any = {
        dataset: {
          provider: StorageProviders.AWS,
          region: AWSRegions.EU_CENTRAL_1,
          path: 'folder/test',
        },
      };

      const storageGtMock: any = {
        provider: StorageProviders.AWS,
        region: AWSRegions.EU_CENTRAL_1,
        path: 'folder/test',
      };

      const imageLabelBinaryJobDto: JobCvatDto = {
        chainId: MOCK_CHAIN_ID,
        data: storageDatasetMock,
        labels: MOCK_CVAT_LABELS,
        requesterDescription: MOCK_REQUESTER_DESCRIPTION,
        minQuality: 0.95,
        fundAmount: 10,
        groundTruth: storageGtMock,
        userGuide: MOCK_FILE_URL,
        type: JobRequestType.IMAGE_POINTS,
        currency: JobCurrency.HMT,
      };

      KVStoreUtils.get = jest.fn().mockResolvedValue(MOCK_ORACLE_FEE);

      await expect(
        jobService.createJob(
          userMock,
          JobRequestType.IMAGE_POINTS,
          imageLabelBinaryJobDto,
        ),
      ).rejects.toThrow(
        new ControlledError(ErrorBucket.EmptyBucket, HttpStatus.BAD_REQUEST),
      );

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(
        userMock.id,
        div(1, rate),
      );
    });

    it('should create a image label job successfully on network selected from round robin logic', async () => {
      const fundAmount = imageLabelBinaryJobDto.fundAmount;
      const fee = (MOCK_JOB_LAUNCHER_FEE / 100) * fundAmount;

      const userBalance = 25;
      getUserBalanceMock.mockResolvedValue(userBalance);

      jest
        .spyOn(routingProtocolService, 'selectNetwork')
        .mockReturnValue(ChainId.MOONBEAM);

      KVStoreUtils.get = jest.fn().mockResolvedValue(MOCK_ORACLE_FEE);
      KVStoreUtils.getPublicKey = jest
        .fn()
        .mockResolvedValue(MOCK_PGP_PUBLIC_KEY);

      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValueOnce(MOCK_CVAT_GT);

      (listObjectsInBucket as any).mockResolvedValueOnce([
        '1.jpg',
        '2.jpg',
        '3.jpg',
        '4.jpg',
        '5.jpg',
      ]);

      await jobService.createJob(userMock, JobRequestType.IMAGE_POINTS, {
        ...imageLabelBinaryJobDto,
        chainId: undefined,
      });

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(
        userMock.id,
        div(1, rate),
      );
      expect(jobRepository.createUnique).toHaveBeenCalledWith({
        chainId: ChainId.MOONBEAM,
        userId: userMock.id,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        requestType: JobRequestType.IMAGE_POINTS,
        fee: mul(fee, rate),
        fundAmount: mul(fundAmount, rate),
        status: JobStatus.PENDING,
        waitUntil: expect.any(Date),
        ...selectedOraclesMock,
      });
    });

    it('should throw an exception for invalid chain id provided', async () => {
      web3Service.validateChainId = jest.fn(() => {
        throw new ControlledError(
          ErrorWeb3.InvalidChainId,
          HttpStatus.BAD_REQUEST,
        );
      });

      await expect(
        jobService.createJob(
          userMock,
          JobRequestType.IMAGE_POINTS,
          imageLabelBinaryJobDto,
        ),
      ).rejects.toThrow(
        new ControlledError(ErrorWeb3.InvalidChainId, HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw an exception for insufficient user balance', async () => {
      const userBalance = 1;

      jest
        .spyOn(paymentService, 'getUserBalance')
        .mockResolvedValue(userBalance);

      getUserBalanceMock.mockResolvedValue(userBalance);

      KVStoreUtils.get = jest.fn().mockResolvedValue(MOCK_ORACLE_FEE);

      await expect(
        jobService.createJob(
          userMock,
          JobRequestType.IMAGE_POINTS,
          imageLabelBinaryJobDto,
        ),
      ).rejects.toThrow(
        new ControlledError(ErrorJob.NotEnoughFunds, HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('createJob with hCaptcha type', () => {
    const jobId = 123;
    const userMock: any = {
      id: 1,
      stripeCustomerId: 'stripeTest',
    };

    const hCaptchaJobDto: JobCaptchaDto = {
      data: MOCK_STORAGE_DATA,
      accuracyTarget: 0.9,
      completionDate: new Date(),
      minRequests: 1,
      maxRequests: 4,
      advanced: {
        workerLanguage: WorkerLanguage.EN,
        workerLocation: Country.FR,
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
      KVStoreUtils.get = jest.fn().mockResolvedValue(MOCK_ORACLE_FEE);
      KVStoreUtils.getPublicKey = jest
        .fn()
        .mockResolvedValue(MOCK_PGP_PUBLIC_KEY);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should create a job successfully', async () => {
      hCaptchaJobDto.chainId = ChainId.LOCALHOST;
      const fundAmount = div(
        hCaptchaJobDto.annotations.taskBidPrice * MOCK_BUCKET_FILES.length,
        rate,
      );
      const fee = (MOCK_JOB_LAUNCHER_FEE / 100) * fundAmount;
      const userBalance = 25;
      getUserBalanceMock.mockResolvedValue(userBalance);

      const mockJobEntity: Partial<JobEntity> = {
        id: jobId,
        userId: userMock.id,
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
        userMock,
        JobRequestType.HCAPTCHA,
        hCaptchaJobDto,
      );

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(
        userMock.id,
        div(1, rate),
      );
      expect(paymentRepository.createUnique).toHaveBeenCalledWith({
        userId: userMock.id,
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
        userId: userMock.id,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        requestType: JobRequestType.HCAPTCHA,
        fee: Number(mul(fee, rate).toFixed(3)),
        fundAmount: mul(fundAmount, rate),
        status: JobStatus.PENDING,
        waitUntil: expect.any(Date),
        ...selectedOraclesMock,
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

      await jobService.createJob(userMock, JobRequestType.HCAPTCHA, {
        ...hCaptchaJobDto,
        chainId: undefined,
      });

      expect(paymentService.getUserBalance).toHaveBeenCalledWith(
        userMock.id,
        div(1, rate),
      );
      expect(jobRepository.createUnique).toHaveBeenCalledWith({
        chainId: ChainId.MOONBEAM,
        userId: userMock.id,
        manifestUrl: expect.any(String),
        manifestHash: expect.any(String),
        requestType: JobRequestType.HCAPTCHA,
        fee: mul(fee, rate),
        fundAmount: mul(fundAmount, rate),
        status: JobStatus.PENDING,
        waitUntil: expect.any(Date),
        ...selectedOraclesMock,
      });
    });

    it('should throw an exception for insufficient user balance', async () => {
      const userBalance = 1;
      hCaptchaJobDto.chainId = ChainId.LOCALHOST;

      jest
        .spyOn(paymentService, 'getUserBalance')
        .mockResolvedValue(userBalance);

      getUserBalanceMock.mockResolvedValue(userBalance);
      await expect(
        jobService.createJob(userMock, JobRequestType.HCAPTCHA, hCaptchaJobDto),
      ).rejects.toThrow(
        new ControlledError(ErrorJob.NotEnoughFunds, HttpStatus.BAD_REQUEST),
      );
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
        userId: 1,
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
      KVStoreUtils.get = jest.fn().mockResolvedValue(MOCK_ORACLE_FEE);
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

      storageService.downloadJsonLikeData = jest.fn().mockReturnValue(manifest);

      const jobEntityResult = await jobService.setupEscrow(
        mockJobEntity as JobEntity,
      );

      mockJobEntity.status = JobStatus.FUNDED;
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

      storageService.downloadJsonLikeData = jest.fn().mockReturnValue(manifest);

      await expect(
        jobService.setupEscrow(mockJobEntity as JobEntity),
      ).rejects.toThrow(
        new ControlledError(
          ErrorJob.ManifestValidationFailed,
          HttpStatus.NOT_FOUND,
        ),
      );
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

      storageService.downloadJsonLikeData = jest.fn().mockReturnValue(manifest);

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
        status: JobStatus.FUNDED,
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
        status: JobStatus.FUNDED,
        userId: 1,
        fundAmount: 100,
        save: jest.fn().mockResolvedValue(true),
      };

      await expect(
        jobService.fundEscrow(mockJobEntity as JobEntity),
      ).rejects.toThrow();
      expect(createWebhookMock).not.toHaveBeenCalled();
    });
  });

  describe('requestToCancelJobById', () => {
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

      await jobService.requestToCancelJobById(userId, jobId);

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

      await jobService.requestToCancelJobById(userId, jobId);

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
        jobService.requestToCancelJobById(userId, jobId),
      ).rejects.toThrow(
        new ControlledError(ErrorJob.NotFound, HttpStatus.NOT_FOUND),
      );
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
        jobService.requestToCancelJobById(userId, jobId),
      ).rejects.toThrow(
        new ControlledError(
          ErrorJob.InvalidStatusCancellation,
          HttpStatus.CONFLICT,
        ),
      );
    });
  });

  describe('requestToCancelJobByAddress', () => {
    const jobId = 1;
    const chainId = ChainId.LOCALHOST;
    const escrowAddress = MOCK_ADDRESS;
    const userId = 123;

    beforeEach(() => {
      web3Service.validateChainId = jest.fn().mockResolvedValue(() => {});
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

      jobRepository.findOneByChainIdAndEscrowAddress = jest
        .fn()
        .mockResolvedValue(mockJobEntity);
      paymentService.createRefundPayment = jest
        .fn()
        .mockResolvedValue(mockJobEntity);

      await jobService.requestToCancelJobByAddress(
        userId,
        chainId,
        escrowAddress,
      );

      expect(
        jobRepository.findOneByChainIdAndEscrowAddress,
      ).toHaveBeenCalledWith(chainId, escrowAddress);
      expect(paymentService.createRefundPayment).toHaveBeenCalledWith({
        jobId,
        userId,
        refundAmount: fundAmount,
      });
      mockJobEntity.status = JobStatus.CANCELED;
      expect(jobRepository.updateOne).toHaveBeenCalledWith(mockJobEntity);
    });

    it('should cancel the job when status is Paid', async () => {
      const fundAmount = 1000;
      const mockJobEntity: Partial<JobEntity> = {
        id: jobId,
        userId,
        status: JobStatus.PAID,
        chainId: ChainId.LOCALHOST,
        fundAmount: fundAmount,
        save: jest.fn().mockResolvedValue(true),
      };

      jobRepository.findOneByChainIdAndEscrowAddress = jest
        .fn()
        .mockResolvedValue(mockJobEntity);
      paymentService.createRefundPayment = jest
        .fn()
        .mockResolvedValue(mockJobEntity);
      (jobService as any).cronJobRepository.findOneByType = jest
        .fn()
        .mockResolvedValueOnce({
          id: 1,
          startedAt: new Date(),
          completedAt: new Date(),
          cronJobType: CronJobType.CreateEscrow,
        });

      await jobService.requestToCancelJobByAddress(
        userId,
        chainId,
        escrowAddress,
      );

      expect(
        jobRepository.findOneByChainIdAndEscrowAddress,
      ).toHaveBeenCalledWith(chainId, escrowAddress);
      expect(paymentService.createRefundPayment).toHaveBeenCalledWith({
        jobId,
        userId,
        refundAmount: fundAmount,
      });
      mockJobEntity.status = JobStatus.CANCELED;
      expect(jobRepository.updateOne).toHaveBeenCalledWith(mockJobEntity);
    });

    it('should set to cancel the job when status is Paid and cron job is running', async () => {
      const fundAmount = 1000;
      const mockJobEntity: Partial<JobEntity> = {
        id: jobId,
        userId,
        status: JobStatus.PAID,
        chainId: ChainId.LOCALHOST,
        fundAmount: fundAmount,
        save: jest.fn().mockResolvedValue(true),
      };

      jobRepository.findOneByChainIdAndEscrowAddress = jest
        .fn()
        .mockResolvedValue(mockJobEntity);
      paymentService.createRefundPayment = jest
        .fn()
        .mockResolvedValue(mockJobEntity);
      (jobService as any).cronJobRepository.findOneByType = jest
        .fn()
        .mockResolvedValueOnce({
          id: 1,
          startedAt: new Date(),
          cronJobType: CronJobType.CreateEscrow,
        });

      await expect(
        jobService.requestToCancelJobByAddress(userId, chainId, escrowAddress),
      ).rejects.toThrow(
        new ControlledError(
          ErrorJob.CancelWhileProcessing,
          HttpStatus.CONFLICT,
        ),
      );

      expect(
        jobRepository.findOneByChainIdAndEscrowAddress,
      ).toHaveBeenCalledWith(chainId, escrowAddress);
      expect(paymentService.createRefundPayment).not.toHaveBeenCalled();
      expect(jobRepository.updateOne).not.toHaveBeenCalled();
    });

    it('should cancel the job when status is Created', async () => {
      const fundAmount = 1000;
      const mockJobEntity: Partial<JobEntity> = {
        id: jobId,
        userId,
        status: JobStatus.CREATED,
        chainId: ChainId.LOCALHOST,
        fundAmount: fundAmount,
        save: jest.fn().mockResolvedValue(true),
      };

      jobRepository.findOneByChainIdAndEscrowAddress = jest
        .fn()
        .mockResolvedValue(mockJobEntity);
      paymentService.createRefundPayment = jest
        .fn()
        .mockResolvedValue(mockJobEntity);
      (jobService as any).cronJobRepository.findOneByType = jest
        .fn()
        .mockResolvedValueOnce({
          id: 1,
          startedAt: new Date(),
          completedAt: new Date(),
          cronJobType: CronJobType.CreateEscrow,
        });

      await jobService.requestToCancelJobByAddress(
        userId,
        chainId,
        escrowAddress,
      );

      expect(
        jobRepository.findOneByChainIdAndEscrowAddress,
      ).toHaveBeenCalledWith(chainId, escrowAddress);
      expect(paymentService.createRefundPayment).toHaveBeenCalledWith({
        jobId,
        userId,
        refundAmount: fundAmount,
      });
      mockJobEntity.status = JobStatus.CANCELED;
      expect(jobRepository.updateOne).toHaveBeenCalledWith(mockJobEntity);
    });

    it('should set to cancel the job when status is Created and cron job is running', async () => {
      const fundAmount = 1000;
      const mockJobEntity: Partial<JobEntity> = {
        id: jobId,
        userId,
        status: JobStatus.CREATED,
        chainId: ChainId.LOCALHOST,
        fundAmount: fundAmount,
        save: jest.fn().mockResolvedValue(true),
      };

      jobRepository.findOneByChainIdAndEscrowAddress = jest
        .fn()
        .mockResolvedValue(mockJobEntity);
      paymentService.createRefundPayment = jest
        .fn()
        .mockResolvedValue(mockJobEntity);
      (jobService as any).cronJobRepository.findOneByType = jest
        .fn()
        .mockResolvedValueOnce({
          id: 1,
          startedAt: new Date(),
          cronJobType: CronJobType.CreateEscrow,
        });

      await expect(
        jobService.requestToCancelJobByAddress(userId, chainId, escrowAddress),
      ).rejects.toThrow(
        new ControlledError(
          ErrorJob.CancelWhileProcessing,
          HttpStatus.CONFLICT,
        ),
      );

      expect(
        jobRepository.findOneByChainIdAndEscrowAddress,
      ).toHaveBeenCalledWith(chainId, escrowAddress);
      expect(paymentService.createRefundPayment).not.toHaveBeenCalled();
      expect(jobRepository.updateOne).not.toHaveBeenCalled();
    });

    it('should cancel the job when status is Setup', async () => {
      const fundAmount = 1000;
      const mockJobEntity: Partial<JobEntity> = {
        id: jobId,
        userId,
        status: JobStatus.FUNDED,
        chainId: ChainId.LOCALHOST,
        fundAmount: fundAmount,
        save: jest.fn().mockResolvedValue(true),
      };

      jobRepository.findOneByChainIdAndEscrowAddress = jest
        .fn()
        .mockResolvedValue(mockJobEntity);
      paymentService.createRefundPayment = jest
        .fn()
        .mockResolvedValue(mockJobEntity);
      (jobService as any).cronJobRepository.findOneByType = jest
        .fn()
        .mockResolvedValueOnce({
          id: 1,
          startedAt: new Date(),
          completedAt: new Date(),
          cronJobType: CronJobType.CreateEscrow,
        });

      await jobService.requestToCancelJobByAddress(
        userId,
        chainId,
        escrowAddress,
      );

      expect(
        jobRepository.findOneByChainIdAndEscrowAddress,
      ).toHaveBeenCalledWith(chainId, escrowAddress);
      expect(paymentService.createRefundPayment).toHaveBeenCalledWith({
        jobId,
        userId,
        refundAmount: fundAmount,
      });
      mockJobEntity.status = JobStatus.CANCELED;
      expect(jobRepository.updateOne).toHaveBeenCalledWith(mockJobEntity);
    });

    it('should set to cancel the job when status is Setup and cron job is running', async () => {
      const fundAmount = 1000;
      const mockJobEntity: Partial<JobEntity> = {
        id: jobId,
        userId,
        status: JobStatus.FUNDED,
        chainId: ChainId.LOCALHOST,
        fundAmount: fundAmount,
        save: jest.fn().mockResolvedValue(true),
      };

      jobRepository.findOneByChainIdAndEscrowAddress = jest
        .fn()
        .mockResolvedValue(mockJobEntity);
      paymentService.createRefundPayment = jest
        .fn()
        .mockResolvedValue(mockJobEntity);
      (jobService as any).cronJobRepository.findOneByType = jest
        .fn()
        .mockResolvedValueOnce({
          id: 1,
          startedAt: new Date(),
          cronJobType: CronJobType.CreateEscrow,
        });

      await expect(
        jobService.requestToCancelJobByAddress(userId, chainId, escrowAddress),
      ).rejects.toThrow(
        new ControlledError(
          ErrorJob.CancelWhileProcessing,
          HttpStatus.CONFLICT,
        ),
      );

      expect(
        jobRepository.findOneByChainIdAndEscrowAddress,
      ).toHaveBeenCalledWith(chainId, escrowAddress);
      expect(paymentService.createRefundPayment).not.toHaveBeenCalled();
      expect(jobRepository.updateOne).not.toHaveBeenCalled();
    });

    it('should set to cancel the job when status is Launched', async () => {
      const escrowAddress = MOCK_ADDRESS;
      const mockJobEntity: Partial<JobEntity> = {
        id: 1,
        userId,
        status: JobStatus.LAUNCHED,
        escrowAddress,
        chainId: ChainId.LOCALHOST,
        save: jest.fn().mockResolvedValue(true),
      };

      jobRepository.findOneByChainIdAndEscrowAddress = jest
        .fn()
        .mockResolvedValue(mockJobEntity);

      await jobService.requestToCancelJobByAddress(
        userId,
        chainId,
        escrowAddress,
      );

      expect(
        jobRepository.findOneByChainIdAndEscrowAddress,
      ).toHaveBeenCalledWith(chainId, escrowAddress);
      mockJobEntity.status = JobStatus.TO_CANCEL;
      expect(jobRepository.updateOne).toHaveBeenCalledWith(mockJobEntity);
      expect(paymentService.createRefundPayment).not.toHaveBeenCalled();
    });

    it('should throw not found exception if job not found', async () => {
      jobRepository.findOneByChainIdAndEscrowAddress = jest
        .fn()
        .mockResolvedValue(undefined);

      await expect(
        jobService.requestToCancelJobByAddress(userId, chainId, escrowAddress),
      ).rejects.toThrow(
        new ControlledError(ErrorJob.NotFound, HttpStatus.NOT_FOUND),
      );
    });

    it('should throw not found exception if job not found when an invalid chain id', async () => {
      web3Service.validateChainId = jest
        .fn()
        .mockRejectedValue(
          new ControlledError(ErrorWeb3.InvalidChainId, HttpStatus.BAD_REQUEST),
        );

      await expect(
        jobService.requestToCancelJobByAddress(userId, 123, escrowAddress),
      ).rejects.toThrow(
        new ControlledError(ErrorWeb3.InvalidChainId, HttpStatus.NOT_FOUND),
      );
    });

    it('should throw not found exception if job not found when an escrow address is not valid', async () => {
      jobRepository.findOneByChainIdAndEscrowAddress = jest
        .fn()
        .mockResolvedValue(undefined);

      await expect(
        jobService.requestToCancelJobByAddress(userId, chainId, '0x123'),
      ).rejects.toThrow(
        new ControlledError(ErrorJob.NotFound, HttpStatus.NOT_FOUND),
      );
    });

    it('should throw an error if status is invalid', async () => {
      const mockJobEntity: Partial<JobEntity> = {
        id: jobId,
        userId,
        status: JobStatus.COMPLETED,
        chainId: ChainId.LOCALHOST,
        save: jest.fn().mockResolvedValue(true),
      };

      jobRepository.findOneByChainIdAndEscrowAddress = jest
        .fn()
        .mockResolvedValue(mockJobEntity);

      await expect(
        jobService.requestToCancelJobByAddress(userId, chainId, escrowAddress),
      ).rejects.toThrow(
        new ControlledError(
          ErrorJob.InvalidStatusCancellation,
          HttpStatus.CONFLICT,
        ),
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
      ).rejects.toThrow(
        new ControlledError(
          ErrorEscrow.InvalidStatusCancellation,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw bad request exception if escrowStatus is Paid', async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Paid),
      }));

      await expect(
        jobService.processEscrowCancellation(jobEntityMock as any),
      ).rejects.toThrow(
        new ControlledError(
          ErrorEscrow.InvalidStatusCancellation,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw bad request exception if escrowStatus is Cancelled', async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Cancelled),
      }));

      await expect(
        jobService.processEscrowCancellation(jobEntityMock as any),
      ).rejects.toThrow(
        new ControlledError(
          ErrorEscrow.InvalidStatusCancellation,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw bad request exception if escrow balance is zero', async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Launched),
        getBalance: jest.fn().mockResolvedValue(0n),
      }));

      await expect(
        jobService.processEscrowCancellation(jobEntityMock as any),
      ).rejects.toThrow(
        new ControlledError(
          ErrorEscrow.InvalidBalanceCancellation,
          HttpStatus.BAD_REQUEST,
        ),
      );
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

    let uploadJsonLikeMock: any;

    beforeEach(() => {
      uploadJsonLikeMock = jest.spyOn(storageService, 'uploadJsonLikeData');
    });

    beforeAll(() => {
      KVStoreUtils.getPublicKey = jest
        .fn()
        .mockResolvedValue(MOCK_PGP_PUBLIC_KEY);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should save the manifest and return the manifest URL and hash', async () => {
      uploadJsonLikeMock.mockResolvedValue([
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

      expect(storageService.uploadJsonLikeData).toHaveBeenCalled();
      expect(
        JSON.parse(
          Buffer.from(
            await encryption.decrypt(
              (storageService.uploadJsonLikeData as any).mock.calls[0][0],
            ),
          ).toString(),
        ),
      ).toEqual(fortuneManifestParams);
    });

    it('should throw an error if the manifest file fails to upload', async () => {
      const uploadError = new Error(ErrorBucket.UnableSaveFile);

      uploadJsonLikeMock.mockRejectedValue(uploadError);

      await expect(
        jobService.uploadManifest(
          JobRequestType.FORTUNE,
          chainId,
          fortuneManifestParams,
        ),
      ).rejects.toThrow(
        new ControlledError(ErrorBucket.UnableSaveFile, HttpStatus.BAD_GATEWAY),
      );

      expect(storageService.uploadJsonLikeData).toHaveBeenCalled();
      expect(
        JSON.parse(
          Buffer.from(
            await encryption.decrypt(
              (storageService.uploadJsonLikeData as any).mock.calls[0][0],
            ),
          ).toString(),
        ),
      ).toEqual(fortuneManifestParams);
    });

    it('should rethrow any other errors encountered', async () => {
      const errorMessage = 'Something went wrong';
      const uploadError = new Error(errorMessage);

      uploadJsonLikeMock.mockRejectedValue(uploadError);

      await expect(
        jobService.uploadManifest(
          JobRequestType.FORTUNE,
          chainId,
          fortuneManifestParams,
        ),
      ).rejects.toThrow(new Error(errorMessage));

      expect(storageService.uploadJsonLikeData).toHaveBeenCalled();
      expect(
        JSON.parse(
          Buffer.from(
            await encryption.decrypt(
              (storageService.uploadJsonLikeData as any).mock.calls[0][0],
            ),
          ).toString(),
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
        job_size: 1,
      },
      validation: {
        min_quality: 1,
        val_size: 2,
        gt_url: '',
      },
      job_bounty: '1',
    };

    let uploadJsonLikeMock: any;

    beforeEach(() => {
      uploadJsonLikeMock = jest.spyOn(storageService, 'uploadJsonLikeData');
    });

    beforeAll(() => {
      KVStoreUtils.getPublicKey = jest
        .fn()
        .mockResolvedValue(MOCK_PGP_PUBLIC_KEY);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should save the manifest and return the manifest URL and hash', async () => {
      uploadJsonLikeMock.mockResolvedValue([
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

      expect(storageService.uploadJsonLikeData).toHaveBeenCalled();
      expect(
        JSON.parse(
          Buffer.from(
            await encryption.decrypt(
              (storageService.uploadJsonLikeData as any).mock.calls[0][0],
            ),
          ).toString(),
        ),
      ).toEqual(manifest);
    });

    it('should throw an error if the manifest file fails to upload', async () => {
      const uploadError = new Error(ErrorBucket.UnableSaveFile);

      uploadJsonLikeMock.mockRejectedValue(uploadError);

      await expect(
        jobService.uploadManifest(
          JobRequestType.IMAGE_POINTS,
          chainId,
          manifest,
        ),
      ).rejects.toThrow(
        new ControlledError(ErrorBucket.UnableSaveFile, HttpStatus.BAD_GATEWAY),
      );

      expect(storageService.uploadJsonLikeData).toHaveBeenCalled();
      expect(
        JSON.parse(
          Buffer.from(
            await encryption.decrypt(
              (storageService.uploadJsonLikeData as any).mock.calls[0][0],
            ),
          ).toString(),
        ),
      ).toEqual(manifest);
    });

    it('should rethrow any other errors encountered', async () => {
      const errorMessage = 'Something went wrong';
      const uploadError = new Error(errorMessage);

      uploadJsonLikeMock.mockRejectedValue(uploadError);

      await expect(
        jobService.uploadManifest(
          JobRequestType.IMAGE_POINTS,
          chainId,
          manifest,
        ),
      ).rejects.toThrow(new Error(errorMessage));
      expect(storageService.uploadJsonLikeData).toHaveBeenCalled();
      expect(
        JSON.parse(
          Buffer.from(
            await encryption.decrypt(
              (storageService.uploadJsonLikeData as any).mock.calls[0][0],
            ),
          ).toString(),
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

    let uploadJsonLikeMock: any;

    beforeEach(() => {
      uploadJsonLikeMock = jest.spyOn(storageService, 'uploadJsonLikeData');
    });

    beforeAll(() => {
      KVStoreUtils.getPublicKey = jest
        .fn()
        .mockResolvedValue(MOCK_PGP_PUBLIC_KEY);
      encrypt = false;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    afterAll(() => {
      encrypt = true;
    });

    it('should save the manifest and return the manifest URL and hash', async () => {
      uploadJsonLikeMock.mockResolvedValue([
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

      expect(storageService.uploadJsonLikeData).toHaveBeenCalled();
      expect(
        (storageService.uploadJsonLikeData as any).mock.calls[0][0],
      ).toEqual(fortuneManifestParams);
    });

    it('should throw an error if the manifest file fails to upload', async () => {
      const uploadError = new Error(ErrorBucket.UnableSaveFile);

      uploadJsonLikeMock.mockRejectedValue(uploadError);

      await expect(
        jobService.uploadManifest(
          JobRequestType.FORTUNE,
          chainId,
          fortuneManifestParams,
        ),
      ).rejects.toThrow(
        new ControlledError(ErrorBucket.UnableSaveFile, HttpStatus.BAD_GATEWAY),
      );

      expect(storageService.uploadJsonLikeData).toHaveBeenCalled();
      expect(
        (storageService.uploadJsonLikeData as any).mock.calls[0][0],
      ).toEqual(fortuneManifestParams);
    });

    it('should rethrow any other errors encountered', async () => {
      const errorMessage = 'Something went wrong';
      const uploadError = new Error(errorMessage);

      uploadJsonLikeMock.mockRejectedValue(uploadError);

      await expect(
        jobService.uploadManifest(
          JobRequestType.FORTUNE,
          chainId,
          fortuneManifestParams,
        ),
      ).rejects.toThrow(new Error(errorMessage));

      expect(storageService.uploadJsonLikeData).toHaveBeenCalled();
      expect(
        (storageService.uploadJsonLikeData as any).mock.calls[0][0],
      ).toEqual(fortuneManifestParams);
    });
  });

  describe('getResult', () => {
    let downloadJsonLIkeDataMock: any;

    beforeEach(() => {
      downloadJsonLIkeDataMock = storageService.downloadJsonLikeData;
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
      downloadJsonLIkeDataMock.mockResolvedValueOnce(fortuneResult);

      const result = await jobService.getResult(MOCK_USER_ID, MOCK_JOB_ID);

      expect(storageService.downloadJsonLikeData).toHaveBeenCalledWith(
        MOCK_FILE_URL,
      );
      expect(storageService.downloadJsonLikeData).toHaveBeenCalledTimes(1);
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

    it('should throw a ControlledError if the result is not found', async () => {
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

      downloadJsonLIkeDataMock.mockResolvedValueOnce([]);

      await expect(
        jobService.getResult(MOCK_USER_ID, MOCK_JOB_ID),
      ).rejects.toThrow(
        new ControlledError(ErrorJob.ResultNotFound, HttpStatus.NOT_FOUND),
      );
      expect(storageService.downloadJsonLikeData).toHaveBeenCalledWith(
        MOCK_FILE_URL,
      );
      expect(storageService.downloadJsonLikeData).toHaveBeenCalledTimes(1);
    });

    it('should throw a ControlledError if the result is not valid', async () => {
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
      downloadJsonLIkeDataMock.mockResolvedValueOnce(fortuneResult);

      await expect(
        jobService.getResult(MOCK_USER_ID, MOCK_JOB_ID),
      ).rejects.toThrow(
        new ControlledError(
          ErrorJob.ResultValidationFailed,
          HttpStatus.NOT_FOUND,
        ),
      );

      expect(storageService.downloadJsonLikeData).toHaveBeenCalledWith(
        MOCK_FILE_URL,
      );
      expect(storageService.downloadJsonLikeData).toHaveBeenCalledTimes(1);
    });
  });

  describe('downloadJobResults', () => {
    let downloadFileMock: any;

    beforeEach(() => {
      downloadFileMock = storageService.downloadFile;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should download and return the binary result', async () => {
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

      const sampleFile = Buffer.from('test-file-contents');
      downloadFileMock.mockImplementationOnce((url: string) => {
        if (url === MOCK_FILE_URL) {
          return sampleFile;
        }

        return null;
      });

      const { contents, filename } = await jobService.downloadJobResults(
        MOCK_USER_ID,
        MOCK_JOB_ID,
      );

      expect(contents).toEqual(sampleFile);
      expect(filename).toBe('file.json');
    });

    it('should throw a ControlledError if the result is not found', async () => {
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
        getResultsUrl: () => null,
      }));

      await expect(
        jobService.downloadJobResults(MOCK_USER_ID, MOCK_JOB_ID),
      ).rejects.toThrow(
        new ControlledError(ErrorJob.ResultNotFound, HttpStatus.NOT_FOUND),
      );
    });

    it('should throw a ControlledError if attempt to download for fortune', async () => {
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

      await expect(
        jobService.downloadJobResults(MOCK_USER_ID, MOCK_JOB_ID),
      ).rejects.toThrow(
        new ControlledError(
          ErrorJob.InvalidRequestType,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('getJobsByStatus', () => {
    const userId = 1;
    const page = 0;
    const pageSize = 5;

    it('should call the database with PENDING status', async () => {
      const jobEntityMock = [
        {
          status: JobStatus.PENDING,
          fundAmount: 100,
          userId: 1,
          id: 1,
          escrowAddress: MOCK_ADDRESS,
          chainId: ChainId.LOCALHOST,
        },
      ];
      jest
        .spyOn(jobRepository, 'fetchFiltered')
        .mockResolvedValue({ entities: jobEntityMock as any, itemCount: 1 });
      await jobService.getJobsByStatus(
        {
          chainId: [ChainId.LOCALHOST],
          status: JobStatusFilter.PENDING,
          page,
          pageSize,
          skip: page * pageSize,
        },
        userId,
      );
      expect(jobRepository.fetchFiltered).toHaveBeenCalledWith(
        {
          chainId: [ChainId.LOCALHOST],
          status: JobStatusFilter.PENDING,
          page,
          pageSize,
          skip: page * pageSize,
        },
        userId,
      );
    });
    it('should call the database with FAILED status', async () => {
      const jobEntityMock = [
        {
          status: JobStatus.FAILED,
          fundAmount: 100,
          userId: 1,
          id: 1,
          escrowAddress: MOCK_ADDRESS,
          chainId: ChainId.LOCALHOST,
        },
      ];
      jest
        .spyOn(jobRepository, 'fetchFiltered')
        .mockResolvedValue({ entities: jobEntityMock as any, itemCount: 1 });
      await jobService.getJobsByStatus(
        {
          chainId: [ChainId.LOCALHOST],
          status: JobStatusFilter.FAILED,
          page,
          pageSize,
          skip: page * pageSize,
        },
        userId,
      );
      expect(jobRepository.fetchFiltered).toHaveBeenCalledWith(
        {
          chainId: [ChainId.LOCALHOST],
          status: JobStatusFilter.FAILED,
          page,
          pageSize,
          skip: page * pageSize,
        },
        userId,
      );
    });
    it('should call the database with LAUNCHED status', async () => {
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
      jest
        .spyOn(jobRepository, 'fetchFiltered')
        .mockResolvedValue({ entities: jobEntityMock as any, itemCount: 1 });
      await jobService.getJobsByStatus(
        {
          chainId: [ChainId.LOCALHOST],
          status: JobStatusFilter.LAUNCHED,
          page,
          pageSize,
          skip: page * pageSize,
        },
        userId,
      );

      expect(jobRepository.fetchFiltered).toHaveBeenCalledWith(
        {
          chainId: [ChainId.LOCALHOST],
          status: JobStatusFilter.LAUNCHED,
          page,
          pageSize,
          skip: page * pageSize,
        },
        userId,
      );
    });
    it('should call the database with CANCELLED status', async () => {
      const jobEntityMock = [
        {
          status: JobStatus.CANCELED,
          fundAmount: 100,
          userId: 1,
          id: 1,
          escrowAddress: MOCK_ADDRESS,
          chainId: ChainId.LOCALHOST,
        },
      ];
      jest
        .spyOn(jobRepository, 'fetchFiltered')
        .mockResolvedValue({ entities: jobEntityMock as any, itemCount: 1 });
      await jobService.getJobsByStatus(
        {
          chainId: [ChainId.LOCALHOST],
          status: JobStatusFilter.PENDING,
          page,
          pageSize,
          skip: page * pageSize,
        },
        userId,
      );
      expect(jobRepository.fetchFiltered).toHaveBeenCalledWith(
        {
          chainId: [ChainId.LOCALHOST],
          status: JobStatusFilter.PENDING,
          page,
          pageSize,
          skip: page * pageSize,
        },
        userId,
      );
    });

    it('should call the database with COMPLETED status', async () => {
      const jobEntityMock = [
        {
          status: JobStatus.COMPLETED,
          fundAmount: 100,
          userId: 1,
          id: 1,
          escrowAddress: MOCK_ADDRESS,
          chainId: ChainId.LOCALHOST,
        },
      ];
      jest
        .spyOn(jobRepository, 'fetchFiltered')
        .mockResolvedValue({ entities: jobEntityMock as any, itemCount: 1 });
      await jobService.getJobsByStatus(
        {
          chainId: [ChainId.LOCALHOST],
          status: JobStatusFilter.COMPLETED,
          page,
          pageSize,
          skip: page * pageSize,
        },
        userId,
      );
      expect(jobRepository.fetchFiltered).toHaveBeenCalledWith(
        {
          chainId: [ChainId.LOCALHOST],
          status: JobStatusFilter.COMPLETED,
          page,
          pageSize,
          skip: page * pageSize,
        },
        userId,
      );
    });

    it('should call the database with PARTIAL status', async () => {
      const jobEntityMock = [
        {
          status: JobStatus.PARTIAL,
          fundAmount: 100,
          userId: 1,
          id: 1,
          escrowAddress: MOCK_ADDRESS,
          chainId: ChainId.LOCALHOST,
        },
      ];
      jest
        .spyOn(jobRepository, 'fetchFiltered')
        .mockResolvedValue({ entities: jobEntityMock as any, itemCount: 1 });
      await jobService.getJobsByStatus(
        {
          chainId: [ChainId.LOCALHOST],
          status: JobStatusFilter.PARTIAL,
          page,
          pageSize,
          skip: page * pageSize,
        },
        userId,
      );

      expect(jobRepository.fetchFiltered).toHaveBeenCalledWith(
        {
          chainId: [ChainId.LOCALHOST],
          status: JobStatusFilter.PARTIAL,
          page,
          pageSize,
          skip: page * pageSize,
        },
        userId,
      );
    });
  });

  describe('escrowFailedWebhook', () => {
    it('should throw ControlledError for invalid event type', async () => {
      const dto = {
        eventType: 'ANOTHER_EVENT' as EventType,
        chainId: 1,
        escrowAddress: 'address',
        eventData: {
          reason: 'invalid manifest',
        },
      };

      await expect(jobService.escrowFailedWebhook(dto)).rejects.toThrow(
        new ControlledError(ErrorJob.InvalidEventType, HttpStatus.NOT_FOUND),
      );
    });

    it('should throw ControlledError if jobEntity is not found', async () => {
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
        new ControlledError(ErrorJob.NotFound, HttpStatus.NOT_FOUND),
      );
    });

    it('should throw ControlledError if jobEntity status is not LAUNCHED', async () => {
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
        new ControlledError(ErrorJob.NotLaunched, HttpStatus.CONFLICT),
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
        failedReason: ErrorEscrow.NotCanceled,
      };

      const expectedJobDetailsDto: JobDetailsDto = {
        details: {
          escrowAddress: MOCK_ADDRESS,
          manifestUrl: MOCK_FILE_URL,
          manifestHash: MOCK_FILE_HASH,
          balance: expect.any(Number),
          paidOut: expect.any(Number),
          status: JobStatus.TO_CANCEL,
          failedReason: ErrorEscrow.NotCanceled,
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
      storageService.downloadJsonLikeData = jest
        .fn()
        .mockResolvedValue(manifestMock);
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
        failedReason: null,
      };

      const expectedJobDetailsDto: JobDetailsDto = {
        details: {
          escrowAddress: ethers.ZeroAddress,
          manifestUrl: MOCK_FILE_URL,
          manifestHash: MOCK_FILE_HASH,
          balance: 0,
          paidOut: 0,
          status: JobStatus.TO_CANCEL,
          failedReason: null,
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
      };

      jobRepository.findOneByIdAndUserId = jest
        .fn()
        .mockResolvedValue(jobEntityMock as any);
      storageService.downloadJsonLikeData = jest
        .fn()
        .mockResolvedValue(manifestMock);
      jobService.getPaidOutAmount = jest.fn().mockResolvedValue(10);

      const result = await jobService.getDetails(1, 123);
      expect(result).toMatchObject(expectedJobDetailsDto);
    });

    it('should throw not found exception when job not found', async () => {
      jobRepository.findOneByIdAndUserId = jest
        .fn()
        .mockResolvedValue(undefined);

      await expect(jobService.getDetails(1, 123)).rejects.toThrow(
        new ControlledError(ErrorJob.NotFound, HttpStatus.NOT_FOUND),
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

      KVStoreUtils.get = jest.fn().mockResolvedValue(MOCK_ORACLE_FEE);

      const result = await (jobService as any).getOracleFee(
        MOCK_EXCHANGE_ORACLE_ADDRESS,
        ChainId.LOCALHOST,
      );

      expect(Number(result)).toBe(MOCK_ORACLE_FEE);
      expect(typeof result).toBe('bigint');
    });
  });

  describe('escrowCompletedWebhook', () => {
    it('should throw ControlledError if jobEntity is not found', async () => {
      const dto = {
        eventType: EventType.ESCROW_COMPLETED,
        chainId: 1,
        escrowAddress: 'address',
      };
      jobRepository.findOneByChainIdAndEscrowAddress = jest
        .fn()
        .mockResolvedValue(null);

      await expect(jobService.completeJob(dto)).rejects.toThrow(
        new ControlledError(ErrorJob.NotFound, HttpStatus.NOT_FOUND),
      );
    });

    it('should throw ControlledError if jobEntity status is not LAUNCHED', async () => {
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
        new ControlledError(ErrorJob.NotLaunched, HttpStatus.CONFLICT),
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

  describe('isEscrowFunded', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return true for a valid escrow address with a non-zero balance', async () => {
      const chainId = 1;
      const escrowClientMock = {
        getBalance: jest.fn().mockResolvedValue(BigInt(1000)),
      };

      (EscrowClient.build as any).mockImplementation(() => escrowClientMock);

      const result = await jobService.isEscrowFunded(chainId, MOCK_ADDRESS);

      expect(result).toBe(true);
      expect(escrowClientMock.getBalance).toHaveBeenCalledWith(MOCK_ADDRESS);
    });

    it('should return false for a valid escrow address with a zero balance', async () => {
      const chainId = 1;
      const escrowClientMock = {
        getBalance: jest.fn().mockResolvedValue(BigInt(0)),
      };

      (EscrowClient.build as any).mockImplementation(() => escrowClientMock);

      const result = await jobService.isEscrowFunded(chainId, MOCK_ADDRESS);

      expect(result).toBe(false);
      expect(escrowClientMock.getBalance).toHaveBeenCalledWith(MOCK_ADDRESS);
    });

    it('should return false for an invalid escrow address', async () => {
      const chainId = 1;
      const escrowAddress = '';

      const result = await jobService.isEscrowFunded(chainId, escrowAddress);

      expect(result).toBe(false);
      expect(EscrowClient.build).not.toHaveBeenCalled();
    });

    it('should return false when no escrow address is provided', async () => {
      const chainId = 1;
      const escrowAddress = undefined;

      const result = await jobService.isEscrowFunded(
        chainId,
        escrowAddress as any,
      );

      expect(result).toBe(false);
      expect(EscrowClient.build).not.toHaveBeenCalled();
    });
  });
});
