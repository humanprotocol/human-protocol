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
  MOCK_ENCRYPTED_MANIFEST,
  MOCK_EXCHANGE_ORACLE_ADDRESS,
  MOCK_EXCHANGE_ORACLE_FEE,
  MOCK_EXCHANGE_ORACLE_WEBHOOK_URL,
  MOCK_FILE_HASH,
  MOCK_FILE_KEY,
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
  MOCK_RECORDING_ORACLE_FEE,
  MOCK_REPUTATION_ORACLE_ADDRESS,
  MOCK_REPUTATION_ORACLE_FEE,
  MOCK_REQUESTER_DESCRIPTION,
  MOCK_REQUESTER_TITLE,
  MOCK_SUBMISSION_REQUIRED,
  MOCK_TRANSACTION_HASH,
  MOCK_USER_ID,
} from '../../../test/constants';
import { PaymentService } from '../payment/payment.service';
import { Web3Service } from '../web3/web3.service';
import {
  FortuneFinalResultDto,
  FortuneManifestDto,
  CvatManifestDto,
  JobFortuneDto,
  JobCvatDto,
  JobDetailsDto,
  HCaptchaManifestDto,
  JobCaptchaDto,
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

const rate = 1.5;
jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn().mockImplementation(() => ({
      createAndSetupEscrow: jest.fn().mockResolvedValue(MOCK_ADDRESS),
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

describe('JobService', () => {
  let jobService: JobService,
    jobRepository: JobRepository,
    paymentRepository: PaymentRepository,
    paymentService: PaymentService,
    createPaymentMock: any,
    routingProtocolService: RoutingProtocolService,
    web3Service: Web3Service,
    storageService: StorageService;

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
          case 'EXCHANGE_ORACLE_FEE':
            return MOCK_EXCHANGE_ORACLE_FEE;
          case 'RECORDING_ORACLE_FEE':
            return MOCK_RECORDING_ORACLE_FEE;
          case 'REPUTATION_ORACLE_FEE':
            return MOCK_REPUTATION_ORACLE_FEE;
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
            return MOCK_HCAPTCHA_ORACLE_ADDRESS
          
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
        {
          provide: RoutingProtocolService,
          useValue: createMock<RoutingProtocolService>(),
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

    storageService.uploadFile = jest.fn().mockResolvedValue(
      {
        url: MOCK_FILE_URL,
        hash: MOCK_FILE_HASH,
      },
    );

    storageService.download = jest.fn();
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

      storageService.listObjectsInBucket = jest.fn().mockResolvedValue(MOCK_BUCKET_FILES);
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

  describe('calculateJobBounty', () => {
    it('should calculate the job bounty correctly', async () => {
      storageService.listObjectsInBucket = jest.fn().mockResolvedValue(MOCK_BUCKET_FILES);
      const tokenFundAmount = 0.013997056833333334;
      const result = await jobService['calculateJobBounty'](
        MOCK_FILE_URL,
        tokenFundAmount,
      );

      expect(result).toEqual('0.002332842805555555');
    });
  });

  describe('createJob with image label binary type', () => {
    const userId = 1;
    const jobId = 123;

    const imageLabelBinaryJobDto: JobCvatDto = {
      chainId: MOCK_CHAIN_ID,
      dataUrl: MOCK_FILE_URL,
      labels: ['cat', 'dog'],
      requesterDescription: MOCK_REQUESTER_DESCRIPTION,
      minQuality: 0.95,
      fundAmount: 10,
      gtUrl: '',
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
      storageService.listObjectsInBucket = jest.fn().mockResolvedValue(MOCK_BUCKET_FILES);

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

    it('should create a job successfully on network selected from round robin logic', async () => {
      const fundAmount = imageLabelBinaryJobDto.fundAmount;
      const fee = (MOCK_JOB_LAUNCHER_FEE / 100) * fundAmount;

      const userBalance = 25;
      getUserBalanceMock.mockResolvedValue(userBalance);
      storageService.listObjectsInBucket = jest.fn().mockResolvedValue(MOCK_BUCKET_FILES);

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
      storageService.listObjectsInBucket = jest.fn().mockResolvedValue(MOCK_BUCKET_FILES);

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
      dataUrl: MOCK_FILE_URL,  
      accuracyTarget: 0.9,
      completionDate: new Date(),
      minRequests: 1,
      maxRequests: 4,
      advanced: {
        workerLanguage: WorkerLanguage.EN,
        workerLocation: WorkerLocation.FR,
        targetBrowser: WorkerBrowser.DESKTOP
      },
      annotations: {
        typeOfJob: JobCaptchaShapeType.COMPARISON,
        taskBidPrice: 1,
        labelingPrompt: "Test description",
        groundTruths: MOCK_FILE_URL,
        exampleImages: [
          MOCK_FILE_URL
        ]
      }
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
      const fundAmount = div(hCaptchaJobDto.annotations.taskBidPrice * MOCK_BUCKET_FILES.length, rate);
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
      storageService.listObjectsInBucket = jest.fn().mockResolvedValue(MOCK_BUCKET_FILES);
      
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
      const fundAmount = div(hCaptchaJobDto.annotations.taskBidPrice * MOCK_BUCKET_FILES.length, rate);
      const fee = (MOCK_JOB_LAUNCHER_FEE / 100) * fundAmount;

      const userBalance = 25;
      getUserBalanceMock.mockResolvedValue(userBalance);
      storageService.listObjectsInBucket = jest.fn().mockResolvedValue(MOCK_BUCKET_FILES);

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
      storageService.listObjectsInBucket = jest.fn().mockResolvedValue(MOCK_BUCKET_FILES);

      await expect(
        jobService.createJob(
          userId,
          JobRequestType.HCAPTCHA,
          hCaptchaJobDto,
        ),
      ).rejects.toThrowError(ErrorJob.NotEnoughFunds);
    });

    it('should throw an exception if job entity creation fails', async () => {
      const userBalance = 100;

      getUserBalanceMock.mockResolvedValue(userBalance);
      storageService.listObjectsInBucket = jest.fn().mockResolvedValue(MOCK_BUCKET_FILES);

      jest.spyOn(jobRepository, 'create').mockResolvedValue(undefined!);

      await expect(
        jobService.createJob(
          userId,
          JobRequestType.HCAPTCHA,
          hCaptchaJobDto,
        ),
      ).rejects.toThrowError(ErrorJob.NotCreated);
    });
  });

  describe('launchJob', () => {
    const chainId = ChainId.LOCALHOST;

    it('should launch a job successfully', async () => {
      const fundAmount = 10;
      const fee = (MOCK_JOB_LAUNCHER_FEE / 100) * fundAmount;

      const mockJobEntity: Partial<JobEntity> = {
        chainId,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        fee,
        fundAmount,
        status: JobStatus.PENDING,
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

      const jobEntityResult = await jobService.launchJob(
        mockJobEntity as JobEntity,
      );

      mockJobEntity.escrowAddress = MOCK_ADDRESS;
      expect(jobEntityResult).toMatchObject(mockJobEntity);
      expect(mockJobEntity.save).toHaveBeenCalled();
    });

    it('should handle error during job launch', async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        createAndSetupEscrow: jest.fn().mockRejectedValue(new Error()),
      }));

      const mockJobEntity: Partial<JobEntity> = {
        chainId: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      await expect(
        jobService.launchJob(mockJobEntity as JobEntity),
      ).rejects.toThrow();
    });
  });

  describe('fundJob', () => {
    const chainId = ChainId.LOCALHOST;

    it('should fund a job successfully', async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        fund: jest.fn(),
      }));

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
      };

      const jobEntityResult = await jobService.fundJob(
        mockJobEntity as JobEntity,
      );

      mockJobEntity.escrowAddress = MOCK_ADDRESS;
      expect(jobEntityResult).toMatchObject(mockJobEntity);
      expect(jobEntityResult.status).toBe(JobStatus.LAUNCHED);
      expect(mockJobEntity.save).toHaveBeenCalled();
    });

    it('should handle error during job fund', async () => {
      (EscrowClient.build as any).mockImplementation(() => ({
        fund: jest.fn().mockRejectedValue(new Error()),
      }));

      const mockJobEntity: Partial<JobEntity> = {
        chainId: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        status: JobStatus.PENDING,
        save: jest.fn().mockResolvedValue(true),
      };

      await expect(
        jobService.fundJob(mockJobEntity as JobEntity),
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

      const result = await jobService.requestToCancelJob(userId, jobId);

      expect(result).toEqual(true);
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

      const result = await jobService.requestToCancelJob(userId, jobId);

      expect(result).toEqual(true);
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

  describe('cancelCronJob', () => {
    let findOneJobMock: any,
      findOnePaymentMock: any,
      sendWebhookMock: any,
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
      sendWebhookMock = jest.spyOn(jobService, 'sendWebhook');
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
      const manifestMock = {
        requestType: JobRequestType.FORTUNE,
      };
      storageService.download = jest.fn().mockResolvedValue(manifestMock);
      sendWebhookMock.mockResolvedValue(true);

      const result = await jobService.cancelCronJob();

      expect(result).toBeTruthy();
      expect(jobService.processEscrowCancellation).toHaveBeenCalledWith(
        jobEntityMock,
      );
      expect(jobEntityMock.save).toHaveBeenCalled();
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
      sendWebhookMock.mockResolvedValue(true);

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

      const result = await jobService.escrowFailedWebhook(dto);
      expect(result).toBe(true);
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
});
