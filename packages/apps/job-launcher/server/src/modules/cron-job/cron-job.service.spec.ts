import { Test, TestingModule } from '@nestjs/testing';

import { CronJobType } from '../../common/enums/cron-job';

import { createMock } from '@golevelup/ts-jest';
import {
  ChainId,
  Encryption,
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  KVStoreUtils,
  NETWORKS,
} from '@human-protocol/sdk';
import { StatusEvent } from '@human-protocol/sdk/dist/graphql';
import { HttpService } from '@nestjs/axios';
import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { DeepPartial } from 'typeorm';
import {
  MOCK_ADDRESS,
  MOCK_EXCHANGE_ORACLE_ADDRESS,
  MOCK_EXCHANGE_ORACLE_WEBHOOK_URL,
  MOCK_FILE_HASH,
  MOCK_FILE_URL,
  MOCK_MAX_RETRY_COUNT,
  MOCK_TRANSACTION_HASH,
} from '../../../test/constants';
import { AuthConfigService } from '../../common/config/auth-config.service';
import { CvatConfigService } from '../../common/config/cvat-config.service';
import { NetworkConfigService } from '../../common/config/network-config.service';
import { PGPConfigService } from '../../common/config/pgp-config.service';
import { ServerConfigService } from '../../common/config/server-config.service';
import { SlackConfigService } from '../../common/config/slack-config.service';
import { VisionConfigService } from '../../common/config/vision-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import {
  ErrorContentModeration,
  ErrorCronJob,
} from '../../common/constants/errors';
import { JobRequestType, JobStatus } from '../../common/enums/job';
import { WebhookStatus } from '../../common/enums/webhook';
import { ControlledError } from '../../common/errors/controlled';
import { ContentModerationRequestRepository } from '../content-moderation/content-moderation-request.repository';
import { GCVContentModerationService } from '../content-moderation/gcv-content-moderation.service';
import { CvatManifestDto } from '../job/job.dto';
import { JobEntity } from '../job/job.entity';
import { JobRepository } from '../job/job.repository';
import { JobService } from '../job/job.service';
import { PaymentRepository } from '../payment/payment.repository';
import { PaymentService } from '../payment/payment.service';
import { QualificationService } from '../qualification/qualification.service';
import { RateService } from '../rate/rate.service';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import { WebhookEntity } from '../webhook/webhook.entity';
import { WebhookRepository } from '../webhook/webhook.repository';
import { WebhookService } from '../webhook/webhook.service';
import { WhitelistService } from '../whitelist/whitelist.service';
import { CronJobEntity } from './cron-job.entity';
import { CronJobRepository } from './cron-job.repository';
import { CronJobService } from './cron-job.service';
import { RoutingProtocolService } from '../routing-protocol/routing-protocol.service';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn().mockImplementation(() => ({
      createEscrow: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      setup: jest.fn().mockResolvedValue(null),
      fund: jest.fn().mockResolvedValue(null),
    })),
  },
  KVStoreUtils: {
    get: jest.fn(),
  },
  EscrowUtils: {
    getStatusEvents: jest.fn(),
  },
}));

describe('CronJobService', () => {
  let service: CronJobService,
    repository: CronJobRepository,
    webhookService: WebhookService,
    webhookRepository: WebhookRepository,
    storageService: StorageService,
    jobService: JobService,
    contentModerationService: GCVContentModerationService,
    jobRepository: JobRepository;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  beforeEach(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'MAX_RETRY_COUNT':
            return MOCK_MAX_RETRY_COUNT;
        }
      }),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronJobService,
        {
          provide: CronJobRepository,
          useValue: createMock<CronJobRepository>(),
        },
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
            validateChainId: jest.fn().mockReturnValue(new Error()),
            getValidChains: jest.fn().mockReturnValue([ChainId.LOCALHOST]),
            getOperatorAddress: jest.fn().mockReturnValue(MOCK_ADDRESS),
          },
        },
        JobService,
        GCVContentModerationService,
        WebhookService,
        Encryption,
        ServerConfigService,
        AuthConfigService,
        Web3ConfigService,
        CvatConfigService,
        PGPConfigService,
        NetworkConfigService,
        {
          provide: VisionConfigService,
          useValue: {
            projectId: 'test-project-id',
            privateKey: 'test-private-key',
            clientEmail: 'test-client-email',
            tempAsyncResultsBucket: 'test-temp-bucket',
            moderationResultsBucket: 'test-moderation-results-bucket',
          },
        },
        SlackConfigService,
        QualificationService,
        {
          provide: NetworkConfigService,
          useValue: {
            networks: [NETWORKS[ChainId.LOCALHOST]],
          },
        },
        { provide: JobRepository, useValue: createMock<JobRepository>() },
        {
          provide: ContentModerationRequestRepository,
          useValue: createMock<ContentModerationRequestRepository>(),
        },
        {
          provide: PaymentRepository,
          useValue: createMock<PaymentRepository>(),
        },
        { provide: StorageService, useValue: createMock<StorageService>() },
        { provide: PaymentService, useValue: createMock<PaymentService>() },
        { provide: WhitelistService, useValue: createMock<WhitelistService>() },
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: RoutingProtocolService,
          useValue: createMock<RoutingProtocolService>(),
        },
        {
          provide: WebhookRepository,
          useValue: createMock<WebhookRepository>(),
        },
        {
          provide: RateService,
          useValue: createMock<RateService>(),
        },
        { provide: HttpService, useValue: createMock<HttpService>() },
      ],
    }).compile();

    service = module.get<CronJobService>(CronJobService);
    // paymentService = module.get<PaymentService>(PaymentService);
    contentModerationService = module.get<GCVContentModerationService>(
      GCVContentModerationService,
    );
    jobService = module.get<JobService>(JobService);
    jobRepository = module.get<JobRepository>(JobRepository);
    repository = module.get<CronJobRepository>(CronJobRepository);
    webhookService = module.get<WebhookService>(WebhookService);
    webhookRepository = module.get<WebhookRepository>(WebhookRepository);
    storageService = module.get<StorageService>(StorageService);
  });

  describe('startCronJob', () => {
    it('should create a cron job if not exists', async () => {
      const cronJobType = CronJobType.CreateEscrow;

      const cronJobEntity = new CronJobEntity();
      cronJobEntity.cronJobType = cronJobType;
      cronJobEntity.startedAt = new Date();

      jest.spyOn(repository, 'findOneByType').mockResolvedValue(null);

      const createUniqueSpy = jest
        .spyOn(repository, 'createUnique')
        .mockResolvedValue(cronJobEntity);

      const result = await service.startCronJob(cronJobType);

      expect(createUniqueSpy).toHaveBeenCalledWith({
        cronJobType: CronJobType.CreateEscrow,
      });
      expect(result).toEqual(cronJobEntity);
    });

    it('should start a cron job if exists', async () => {
      const cronJobType = CronJobType.CreateEscrow;
      const cronJobEntity: Partial<CronJobEntity> = {
        cronJobType: cronJobType,
        startedAt: new Date(),
        completedAt: new Date(),
      };

      const mockDate = new Date(2023, 12, 23);
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const findOneByTypeSpy = jest
        .spyOn(repository, 'findOneByType')
        .mockResolvedValue(cronJobEntity as any);

      const updateOneSpy = jest
        .spyOn(repository, 'updateOne')
        .mockResolvedValue(cronJobEntity as any);

      const result = await service.startCronJob(cronJobType);

      expect(findOneByTypeSpy).toHaveBeenCalledWith(cronJobType);
      expect(updateOneSpy).toHaveBeenCalled();
      cronJobEntity.startedAt = mockDate;
      expect(result).toEqual(cronJobEntity);

      jest.useRealTimers();
    });
  });

  describe('isCronJobRunning', () => {
    it('should return false if no cron job is running', async () => {
      const cronJobType = CronJobType.CreateEscrow;
      const cronJobEntity = new CronJobEntity();
      cronJobEntity.cronJobType = cronJobType;

      const findOneByTypeSpy = jest
        .spyOn(repository, 'findOneByType')
        .mockResolvedValue(null);

      const result = await service.isCronJobRunning(cronJobType);

      expect(findOneByTypeSpy).toHaveBeenCalledWith(cronJobType);
      expect(result).toEqual(false);
    });

    it('should return false if last cron job is completed', async () => {
      const cronJobType = CronJobType.CreateEscrow;
      const cronJobEntity = new CronJobEntity();
      cronJobEntity.cronJobType = cronJobType;
      cronJobEntity.completedAt = new Date();

      const findOneByTypeSpy = jest
        .spyOn(repository, 'findOneByType')
        .mockResolvedValue(cronJobEntity);

      const result = await service.isCronJobRunning(cronJobType);

      expect(findOneByTypeSpy).toHaveBeenCalledWith(cronJobType);
      expect(result).toEqual(false);
    });

    it('should return true if last cron job is not completed', async () => {
      const cronJobType = CronJobType.CreateEscrow;
      const cronJobEntity = new CronJobEntity();
      cronJobEntity.cronJobType = cronJobType;

      const findOneByTypeSpy = jest
        .spyOn(repository, 'findOneByType')
        .mockResolvedValue(cronJobEntity);

      const result = await service.isCronJobRunning(cronJobType);
      expect(findOneByTypeSpy).toHaveBeenCalledWith(cronJobType);
      expect(result).toEqual(true);
    });
  });

  describe('completeCronJob', () => {
    it('should complete a cron job', async () => {
      const cronJobType = CronJobType.CreateEscrow;
      const cronJobEntity = new CronJobEntity();
      cronJobEntity.cronJobType = cronJobType;

      const mockDate = new Date(2023, 12, 23);

      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const updateOneSpy = jest
        .spyOn(repository, 'updateOne')
        .mockResolvedValue(cronJobEntity);

      const result = await service.completeCronJob(cronJobEntity);

      expect(updateOneSpy).toHaveBeenCalled();
      expect(cronJobEntity.completedAt).toEqual(mockDate);
      expect(result).toEqual(cronJobEntity);

      jest.useRealTimers();
    });

    it('should throw an error if cron job is already completed', async () => {
      const cronJobType = CronJobType.CreateEscrow;
      const cronJobEntity = new CronJobEntity();
      cronJobEntity.cronJobType = cronJobType;
      cronJobEntity.completedAt = new Date();

      const updateOneSpy = jest
        .spyOn(repository, 'updateOne')
        .mockResolvedValue(cronJobEntity);

      await expect(service.completeCronJob(cronJobEntity)).rejects.toThrow(
        new ControlledError(ErrorCronJob.Completed, HttpStatus.BAD_REQUEST),
      );
      expect(updateOneSpy).not.toHaveBeenCalled();
    });
  });

  describe('createEscrowCronJob', () => {
    let createEscrowMock: any;
    let cronJobEntityMock: Partial<CronJobEntity>;
    let jobEntityMock1: Partial<JobEntity>, jobEntityMock2: Partial<JobEntity>;

    beforeEach(() => {
      cronJobEntityMock = {
        cronJobType: CronJobType.CreateEscrow,
        startedAt: new Date(),
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
      };

      jest
        .spyOn(jobRepository, 'findByStatus')
        .mockResolvedValue([jobEntityMock1 as any, jobEntityMock2 as any]);

      jest.spyOn(repository, 'findOneByType').mockResolvedValue(null);
      jest
        .spyOn(repository, 'createUnique')
        .mockResolvedValue(cronJobEntityMock as any);

      createEscrowMock = jest.spyOn(jobService, 'createEscrow');
      createEscrowMock.mockResolvedValue(true);

      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(false);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should not run if the cron job is already running', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValueOnce(true);

      await service.createEscrowCronJob();

      expect(createEscrowMock).not.toHaveBeenCalled();
    });

    it('should create cron job entity on database to lock', async () => {
      jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.createEscrowCronJob();

      expect(service.startCronJob).toHaveBeenCalledWith(
        CronJobType.CreateEscrow,
      );
    });

    it('should run createEscrow for all of the jobs with status PAID', async () => {
      await service.createEscrowCronJob();

      expect(createEscrowMock).toHaveBeenCalledTimes(2);
    });

    it('should increase retriesCount by 1, if the job creation fails', async () => {
      createEscrowMock.mockRejectedValueOnce(new Error('creation failed'));

      await service.createEscrowCronJob();

      expect(createEscrowMock).toHaveBeenCalledTimes(2);
      expect(jobEntityMock1.retriesCount).toBe(2);
      expect(jobEntityMock2.retriesCount).toBe(1);
    });

    it('should mark job as failed if the job creation fails more than max retries count', async () => {
      createEscrowMock.mockRejectedValueOnce(new Error('creation failed'));
      jobEntityMock1.retriesCount = MOCK_MAX_RETRY_COUNT;

      await service.createEscrowCronJob();

      expect(createEscrowMock).toHaveBeenCalledTimes(2);
      expect(jobEntityMock1.status).toBe(JobStatus.FAILED);
      expect(jobEntityMock2.status).toBe(JobStatus.PAID);
    });

    it('should complete the cron job entity on database to unlock', async () => {
      jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.createEscrowCronJob();

      expect(service.completeCronJob).toHaveBeenCalledWith({
        cronJobType: CronJobType.CreateEscrow,
        startedAt: expect.any(Date),
      });
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
      };

      jest
        .spyOn(jobRepository, 'findByStatus')
        .mockResolvedValue([jobEntityMock1 as any, jobEntityMock2 as any]);

      setupEscrowMock = jest.spyOn(jobService, 'setupEscrow');
      setupEscrowMock.mockResolvedValue(true);

      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(false);

      jest.spyOn(repository, 'findOneByType').mockResolvedValue(null);
      jest
        .spyOn(repository, 'createUnique')
        .mockResolvedValue(cronJobEntityMock as any);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should not run if the cron job is already running', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValueOnce(true);

      await service.setupEscrowCronJob();

      expect(setupEscrowMock).not.toHaveBeenCalled();
    });

    it('should create cron job entity on database to lock', async () => {
      jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.setupEscrowCronJob();

      expect(service.startCronJob).toHaveBeenCalledWith(
        CronJobType.SetupEscrow,
      );
    });

    it('should run setupEscrow for all of the jobs with status LAUNCHING', async () => {
      await service.setupEscrowCronJob();

      expect(setupEscrowMock).toHaveBeenCalledTimes(2);
    });

    it('should increase retriesCount by 1, if the job setup fails', async () => {
      setupEscrowMock.mockRejectedValueOnce(new Error('setup failed'));

      await service.setupEscrowCronJob();

      expect(setupEscrowMock).toHaveBeenCalledTimes(2);
      expect(jobEntityMock1.retriesCount).toBe(2);
      expect(jobEntityMock2.retriesCount).toBe(1);
    });

    it('should mark job as failed if the job setup fails more than max retries count', async () => {
      setupEscrowMock.mockRejectedValueOnce(new Error('setup failed'));
      jobEntityMock1.retriesCount = MOCK_MAX_RETRY_COUNT;

      await service.setupEscrowCronJob();

      expect(setupEscrowMock).toHaveBeenCalledTimes(2);
      expect(jobEntityMock1.status).toBe(JobStatus.FAILED);
      expect(jobEntityMock2.status).toBe(JobStatus.CREATED);
    });

    it('should complete the cron job entity on database to unlock', async () => {
      jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.setupEscrowCronJob();

      expect(service.completeCronJob).toHaveBeenCalledWith({
        cronJobType: CronJobType.SetupEscrow,
        createdAt: expect.any(Date),
      });
    });
  });

  describe('fundEscrowCronJob', () => {
    let fundEscrowMock: any;
    let cronJobEntityMock: Partial<CronJobEntity>;
    let jobEntityMock1: Partial<JobEntity>, jobEntityMock2: Partial<JobEntity>;

    beforeEach(() => {
      cronJobEntityMock = {
        cronJobType: CronJobType.FundEscrow,
        createdAt: new Date(),
      };

      jobEntityMock1 = {
        status: JobStatus.FUNDED,
        fundAmount: 100,
        userId: 1,
        id: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        retriesCount: 1,
      };

      jobEntityMock2 = {
        status: JobStatus.FUNDED,
        fundAmount: 100,
        userId: 1,
        id: 1,
        manifestUrl: MOCK_FILE_URL,
        manifestHash: MOCK_FILE_HASH,
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        retriesCount: 1,
      };

      jest
        .spyOn(jobRepository, 'findByStatus')
        .mockResolvedValue([jobEntityMock1 as any, jobEntityMock2 as any]);

      fundEscrowMock = jest.spyOn(jobService, 'fundEscrow');
      fundEscrowMock.mockResolvedValue(true);

      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(false);

      const cvatManifestMock: DeepPartial<CvatManifestDto> = {
        data: {
          data_url: MOCK_FILE_URL,
        },
        annotation: {
          type: JobRequestType.IMAGE_POINTS,
        },
      };
      jest
        .spyOn(storageService, 'downloadJsonLikeData')
        .mockResolvedValue(cvatManifestMock);

      jest.spyOn(repository, 'findOneByType').mockResolvedValue(null);
      jest
        .spyOn(repository, 'createUnique')
        .mockResolvedValue(cronJobEntityMock as any);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should not run if the cron job is already running', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValueOnce(true);

      await service.fundEscrowCronJob();

      expect(fundEscrowMock).not.toHaveBeenCalled();
    });

    it('should create cron job entity on database to lock', async () => {
      jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.fundEscrowCronJob();

      expect(service.startCronJob).toHaveBeenCalledWith(CronJobType.FundEscrow);
    });

    it('should run fundEscrow for all of the jobs with status FUNDING, and trigger webhook', async () => {
      await service.fundEscrowCronJob();

      expect(fundEscrowMock).toHaveBeenCalledTimes(2);
    });

    it('should increase retriesCount by 1, if the job fund fails', async () => {
      fundEscrowMock.mockRejectedValueOnce(new Error('fund failed'));

      await service.fundEscrowCronJob();

      expect(fundEscrowMock).toHaveBeenCalledTimes(2);
      expect(jobEntityMock1.retriesCount).toBe(2);
      expect(jobEntityMock2.retriesCount).toBe(1);
    });

    it('should mark job as failed if the job fund fails more than max retries count', async () => {
      fundEscrowMock.mockRejectedValueOnce(new Error('fund failed'));
      jobEntityMock1.retriesCount = MOCK_MAX_RETRY_COUNT;

      await service.fundEscrowCronJob();

      expect(fundEscrowMock).toHaveBeenCalledTimes(2);
      expect(jobEntityMock1.status).toBe(JobStatus.FAILED);
      expect(jobEntityMock2.status).toBe(JobStatus.FUNDED);
    });

    it('should complete the cron job entity on database to unlock', async () => {
      jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.fundEscrowCronJob();

      expect(service.completeCronJob).toHaveBeenCalledWith({
        cronJobType: CronJobType.FundEscrow,
        createdAt: expect.any(Date),
      });
    });
  });

  describe('cancelCronJob', () => {
    let findJobMock: any,
      cronJobEntityMock: Partial<CronJobEntity>,
      jobEntityMock1: Partial<JobEntity>,
      jobEntityMock2: Partial<JobEntity>;

    beforeEach(() => {
      cronJobEntityMock = {
        cronJobType: CronJobType.CancelEscrow,
        createdAt: new Date(),
      };

      jobEntityMock1 = {
        status: JobStatus.TO_CANCEL,
        fundAmount: 100,
        userId: 1,
        id: 1,
        manifestUrl: MOCK_FILE_URL,
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        retriesCount: 0,
      };

      jobEntityMock2 = {
        status: JobStatus.TO_CANCEL,
        fundAmount: 100,
        userId: 1,
        id: 2,
        manifestUrl: MOCK_FILE_URL,
        escrowAddress: MOCK_ADDRESS,
        chainId: ChainId.LOCALHOST,
        retriesCount: 0,
      };

      findJobMock = jest
        .spyOn(jobRepository, 'findByStatus')
        .mockResolvedValue([jobEntityMock1 as any, jobEntityMock2 as any]);

      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(false);

      jest.spyOn(jobService, 'processEscrowCancellation').mockResolvedValue({
        txHash: MOCK_TRANSACTION_HASH,
        amountRefunded: 1n,
      });

      (EscrowClient.build as any).mockImplementation(() => ({
        getExchangeOracleAddress: jest
          .fn()
          .mockResolvedValue(MOCK_EXCHANGE_ORACLE_ADDRESS),
      }));

      KVStoreUtils.get = jest
        .fn()
        .mockResolvedValue(MOCK_EXCHANGE_ORACLE_WEBHOOK_URL);

      const manifestMock = {
        requestType: JobRequestType.FORTUNE,
      };
      storageService.downloadJsonLikeData = jest
        .fn()
        .mockResolvedValue(manifestMock);

      jest.spyOn(repository, 'findOneByType').mockResolvedValue(null);
      jest
        .spyOn(repository, 'createUnique')
        .mockResolvedValue(cronJobEntityMock as any);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should not run if cron job is already running', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValueOnce(true);

      await service.cancelCronJob();

      expect(findJobMock).not.toHaveBeenCalled();
    });

    it('should create cron job entity on database to lock', async () => {
      jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.cancelCronJob();

      expect(service.startCronJob).toHaveBeenCalledWith(
        CronJobType.CancelEscrow,
      );
    });

    it('should cancel all of the jobs with status TO_CANCEL', async () => {
      jest.spyOn(webhookRepository, 'createUnique');
      jest.spyOn(jobService, 'isEscrowFunded').mockResolvedValue(true);

      const result = await service.cancelCronJob();

      expect(result).toBeTruthy();
      expect(jobService.processEscrowCancellation).toHaveBeenCalledWith(
        jobEntityMock1,
      );
      expect(jobRepository.updateOne).toHaveBeenCalledTimes(2);
      expect(jobService.processEscrowCancellation).toHaveBeenCalledWith(
        jobEntityMock2,
      );
      expect(webhookRepository.createUnique).toHaveBeenCalledTimes(2);
    });

    it('should not call process escrow cancellation when escrowAddress is not present', async () => {
      jest.spyOn(jobService, 'isEscrowFunded').mockResolvedValue(false);

      const jobEntityWithoutEscrow = {
        ...jobEntityMock1,
        escrowAddress: undefined,
      };

      jest
        .spyOn(jobRepository, 'findByStatus')
        .mockResolvedValueOnce([jobEntityWithoutEscrow as any]);
      jest
        .spyOn(jobService, 'processEscrowCancellation')
        .mockResolvedValueOnce(undefined as any);

      expect(await service.cancelCronJob()).toBe(true);
      expect(jobService.processEscrowCancellation).toHaveBeenCalledTimes(0);
    });

    it('should increase retriesCount by 1 if the job cancellation fails', async () => {
      jest.spyOn(jobService, 'isEscrowFunded').mockResolvedValue(true);
      jest
        .spyOn(jobService, 'processEscrowCancellation')
        .mockRejectedValueOnce(new Error('cancellation failed'));

      expect(jobEntityMock1.retriesCount).toBe(0);
      expect(jobEntityMock2.retriesCount).toBe(0);

      await service.cancelCronJob();

      expect(jobEntityMock1.retriesCount).toBe(1);
      expect(jobEntityMock2.retriesCount).toBe(0);
    });

    it('should mark job as failed if the job cancellation fails more than max retries count', async () => {
      jest.spyOn(jobService, 'isEscrowFunded').mockResolvedValue(true);
      jest
        .spyOn(jobService, 'processEscrowCancellation')
        .mockRejectedValueOnce(new Error('cancellation failed'));

      jobEntityMock1.retriesCount = MOCK_MAX_RETRY_COUNT;

      await service.cancelCronJob();

      expect(jobService.processEscrowCancellation).toHaveBeenCalledTimes(2);
      expect(jobEntityMock1.status).toBe(JobStatus.FAILED);
      expect(jobEntityMock2.status).toBe(JobStatus.CANCELED);
    });

    it('should complete the cron job entity on database to unlock', async () => {
      jest.spyOn(service, 'completeCronJob').mockResolvedValueOnce({} as any);

      await service.cancelCronJob();

      expect(service.completeCronJob).toHaveBeenCalledWith({
        cronJobType: CronJobType.CancelEscrow,
        createdAt: expect.any(Date),
      });
    });
  });

  describe('processPendingCronJob', () => {
    let sendWebhookMock: any;
    let cronJobEntityMock: Partial<CronJobEntity>;
    let webhookEntity1: Partial<WebhookEntity>,
      webhookEntity2: Partial<WebhookEntity>;

    beforeEach(() => {
      cronJobEntityMock = {
        cronJobType: CronJobType.ProcessPendingWebhook,
        startedAt: new Date(),
      };

      webhookEntity1 = {
        id: 1,
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        status: WebhookStatus.PENDING,
        waitUntil: new Date(),
        retriesCount: 0,
      };

      webhookEntity2 = {
        id: 2,
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        status: WebhookStatus.PENDING,
        waitUntil: new Date(),
        retriesCount: 0,
      };

      jest
        .spyOn(webhookRepository, 'findByStatusAndType')
        .mockResolvedValue([webhookEntity1 as any, webhookEntity2 as any]);

      sendWebhookMock = jest.spyOn(webhookService as any, 'sendWebhook');
      sendWebhookMock.mockResolvedValue(true);

      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(false);

      jest.spyOn(repository, 'findOneByType').mockResolvedValue(null);
      jest
        .spyOn(repository, 'createUnique')
        .mockResolvedValue(cronJobEntityMock as any);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should not run if cron job is already running', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValueOnce(true);

      const startCronJobMock = jest.spyOn(service, 'startCronJob');

      await service.processPendingWebhooks();

      expect(startCronJobMock).not.toHaveBeenCalled();
    });

    it('should create cron job entity to lock the process', async () => {
      jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.processPendingWebhooks();

      expect(service.startCronJob).toHaveBeenCalledWith(
        CronJobType.ProcessPendingWebhook,
      );
    });

    it('should send webhook for all of the pending webhooks', async () => {
      await service.processPendingWebhooks();

      expect(sendWebhookMock).toHaveBeenCalledTimes(2);
      expect(sendWebhookMock).toHaveBeenCalledWith(webhookEntity1);
      expect(sendWebhookMock).toHaveBeenCalledWith(webhookEntity2);

      expect(webhookRepository.updateOne).toHaveBeenCalledTimes(2);
      expect(webhookEntity1.status).toBe(WebhookStatus.COMPLETED);
      expect(webhookEntity2.status).toBe(WebhookStatus.COMPLETED);
    });

    it('should increase retriesCount by 1 if sending webhook fails', async () => {
      sendWebhookMock.mockRejectedValueOnce(new Error());
      await service.processPendingWebhooks();

      expect(webhookRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity1.status).toBe(WebhookStatus.PENDING);
      expect(webhookEntity1.retriesCount).toBe(1);
      expect(webhookEntity1.waitUntil).toBeInstanceOf(Date);
    });

    it('should mark webhook as failed if retriesCount exceeds threshold', async () => {
      sendWebhookMock.mockRejectedValueOnce(new Error());

      webhookEntity1.retriesCount = MOCK_MAX_RETRY_COUNT;

      await service.processPendingWebhooks();

      expect(webhookRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity1.status).toBe(WebhookStatus.FAILED);
    });

    it('should complete the cron job entity to unlock', async () => {
      jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.processPendingWebhooks();

      expect(service.completeCronJob).toHaveBeenCalledWith(
        cronJobEntityMock as any,
      );
    });
  });

  describe('moderateContentCronJob', () => {
    let contentModerationMock: any;
    let cronJobEntityMock: Partial<CronJobEntity>;
    let jobEntity1: Partial<JobEntity>, jobEntity2: Partial<JobEntity>;

    beforeEach(() => {
      cronJobEntityMock = {
        cronJobType: CronJobType.ContentModeration,
        startedAt: new Date(),
      };

      jobEntity1 = {
        id: 1,
        status: JobStatus.PAID,
      };

      jobEntity2 = {
        id: 2,
        status: JobStatus.PAID,
      };

      jest
        .spyOn(jobRepository, 'findByStatus')
        .mockResolvedValue([jobEntity1 as any, jobEntity2 as any]);

      contentModerationMock = jest.spyOn(
        contentModerationService,
        'moderateJob',
      );
      contentModerationMock.mockResolvedValue(true);

      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(false);

      jest.spyOn(repository, 'findOneByType').mockResolvedValue(null);
      jest
        .spyOn(repository, 'createUnique')
        .mockResolvedValue(cronJobEntityMock as any);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should not run if cron job is already running', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValueOnce(true);

      const startCronJobMock = jest.spyOn(service, 'startCronJob');

      await service.moderateContentCronJob();

      expect(startCronJobMock).not.toHaveBeenCalled();
    });

    it('should create a cron job entity to lock the process', async () => {
      jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.moderateContentCronJob();

      expect(service.startCronJob).toHaveBeenCalledWith(
        CronJobType.ContentModeration,
      );
    });

    it('should process all jobs with status PAID', async () => {
      await service.moderateContentCronJob();

      expect(contentModerationMock).toHaveBeenCalledTimes(2);
      expect(contentModerationMock).toHaveBeenCalledWith(jobEntity1);
      expect(contentModerationMock).toHaveBeenCalledWith(jobEntity2);
    });

    it('should handle failed moderation attempts', async () => {
      const error = new Error('Moderation failed');
      contentModerationMock.mockRejectedValueOnce(error);

      const handleFailureMock = jest.spyOn(
        jobService,
        'handleProcessJobFailure',
      );

      await service.moderateContentCronJob();

      expect(handleFailureMock).toHaveBeenCalledTimes(1);
      expect(handleFailureMock).toHaveBeenCalledWith(
        jobEntity1,
        expect.stringContaining(ErrorContentModeration.ResultsParsingFailed),
      );
      expect(handleFailureMock).not.toHaveBeenCalledWith(
        jobEntity2,
        expect.anything(),
      );
    });

    it('should complete the cron job entity to unlock', async () => {
      jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.moderateContentCronJob();

      expect(service.completeCronJob).toHaveBeenCalledWith(cronJobEntityMock);
    });
  });

  describe('syncJobStuses Cron Job', () => {
    let cronJobEntityMock: Partial<CronJobEntity>;
    let jobEntityMock: Partial<JobEntity>;
    let escrowEventMock: Partial<StatusEvent>;

    beforeEach(() => {
      cronJobEntityMock = {
        cronJobType: CronJobType.SyncJobStatuses,
        startedAt: new Date(),
      };

      jobEntityMock = {
        id: 1,
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        status: JobStatus.PAID,
      };

      escrowEventMock = {
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        status: EscrowStatus[EscrowStatus.Partial],
      };

      jest.spyOn(repository, 'findOneByType').mockResolvedValue(null);

      jest
        .spyOn(repository, 'createUnique')
        .mockResolvedValue(cronJobEntityMock as any);

      jest
        .spyOn(jobRepository, 'findOneByChainIdAndEscrowAddress')
        .mockResolvedValue(jobEntityMock as any);

      (EscrowUtils.getStatusEvents as any).mockResolvedValue([
        escrowEventMock as any,
      ]);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should not run if last cron job is still running', async () => {
      jest.spyOn(repository, 'findOneByType').mockResolvedValueOnce({
        ...cronJobEntityMock,
        completedAt: null,
      } as any);

      const startCronJobMock = jest.spyOn(service, 'startCronJob');

      await service.syncJobStuses();

      expect(startCronJobMock).not.toHaveBeenCalled();
    });

    it('should create cron job entity to lock the process', async () => {
      jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.syncJobStuses();

      expect(service.startCronJob).toHaveBeenCalledWith(
        CronJobType.SyncJobStatuses,
      );
    });

    it('should update job statuses based on escrow events', async () => {
      jest
        .spyOn(jobRepository, 'findManyByChainIdsAndEscrowAddresses')
        .mockResolvedValueOnce([jobEntityMock as any]);

      await service.syncJobStuses();

      expect(EscrowUtils.getStatusEvents).toHaveBeenCalled();
      expect(
        jobRepository.findManyByChainIdsAndEscrowAddresses,
      ).toHaveBeenCalledWith(
        [escrowEventMock.chainId],
        [ethers.getAddress(MOCK_ADDRESS)],
      );
      expect(jobRepository.updateMany).toHaveBeenCalledWith([
        {
          ...jobEntityMock,
          status: JobStatus.PARTIAL,
        },
      ]);
    });

    it('should handle errors and log them', async () => {
      const loggerErrorSpy = jest.spyOn((service as any).logger, 'error');
      jest
        .spyOn(EscrowUtils, 'getStatusEvents')
        .mockRejectedValue(new Error('Test error'));

      await service.syncJobStuses();

      expect(loggerErrorSpy).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should complete the cron job entity to unlock', async () => {
      jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.syncJobStuses();

      expect(service.completeCronJob).toHaveBeenCalledWith(
        cronJobEntityMock as any,
      );
    });
  });

  // describe('processAbuseCronJob', () => {
  //   let sendWebhookMock: any;
  //   let cronJobEntityMock: Partial<CronJobEntity>;
  //   let webhookEntity: Partial<WebhookEntity>, jobEntity: Partial<JobEntity>;

  //   beforeEach(() => {
  //     cronJobEntityMock = {
  //       cronJobType: CronJobType.Abuse,
  //       startedAt: new Date(),
  //     };

  //     webhookEntity = {
  //       id: 1,
  //       chainId: ChainId.LOCALHOST,
  //       escrowAddress: MOCK_ADDRESS,
  //       status: WebhookStatus.PENDING,
  //       waitUntil: new Date(),
  //       retriesCount: 0,
  //     };

  //     jobEntity = {
  //       id: 1,
  //       chainId: ChainId.LOCALHOST,
  //       escrowAddress: MOCK_ADDRESS,
  //       status: JobStatus.PENDING,
  //     };

  //     jest
  //       .spyOn(webhookRepository, 'findByStatusAndType')
  //       .mockResolvedValue([webhookEntity as any]);

  //     sendWebhookMock = jest.spyOn(webhookService as any, 'sendWebhook');
  //     sendWebhookMock.mockResolvedValue(true);

  //     jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(false);

  //     jest.spyOn(repository, 'findOneByType').mockResolvedValue(null);
  //     jest
  //       .spyOn(repository, 'createUnique')
  //       .mockResolvedValue(cronJobEntityMock as any);
  //     jest
  //       .spyOn(jobRepository, 'findOneByChainIdAndEscrowAddress')
  //       .mockResolvedValue(jobEntity as any);
  //     jest
  //       .spyOn(jobService, 'processEscrowCancellation')
  //       .mockResolvedValue(null as any);
  //     jest.spyOn(paymentService, 'createSlash').mockResolvedValue(null as any);
  //   });

  //   afterEach(() => {
  //     jest.restoreAllMocks();
  //   });

  //   it('should not run if cron job is already running', async () => {
  //     jest.spyOn(service, 'isCronJobRunning').mockResolvedValueOnce(true);

  //     const startCronJobMock = jest.spyOn(service, 'startCronJob');

  //     await service.processAbuse();

  //     expect(startCronJobMock).not.toHaveBeenCalled();
  //   });

  //   it('should create cron job entity to lock the process', async () => {
  //     jest
  //       .spyOn(service, 'startCronJob')
  //       .mockResolvedValueOnce(cronJobEntityMock as any);

  //     await service.processAbuse();

  //     expect(service.startCronJob).toHaveBeenCalledWith(CronJobType.Abuse);
  //   });

  //   it('should slash for all of the pending webhooks', async () => {
  //     await service.processAbuse();

  //     expect(jobRepository.updateOne).toHaveBeenCalled();
  //     expect(jobEntity.status).toBe(JobStatus.CANCELED);
  //     expect(webhookRepository.updateOne).toHaveBeenCalled();
  //     expect(webhookEntity.status).toBe(WebhookStatus.COMPLETED);
  //   });

  //   it('should increase retriesCount by 1 if no job is found', async () => {
  //     jest
  //       .spyOn(jobRepository, 'findOneByChainIdAndEscrowAddress')
  //       .mockResolvedValue(null);
  //     await service.processAbuse();

  //     expect(webhookRepository.updateOne).toHaveBeenCalled();
  //     expect(webhookEntity.status).toBe(WebhookStatus.PENDING);
  //     expect(webhookEntity.retriesCount).toBe(1);
  //     expect(webhookEntity.waitUntil).toBeInstanceOf(Date);
  //   });

  //   it('should increase retriesCount by 1 if processEscrowCancellation fails', async () => {
  //     jest
  //       .spyOn(jobService, 'processEscrowCancellation')
  //       .mockRejectedValueOnce(new Error());
  //     await service.processAbuse();

  //     expect(webhookRepository.updateOne).toHaveBeenCalled();
  //     expect(webhookEntity.status).toBe(WebhookStatus.PENDING);
  //     expect(webhookEntity.retriesCount).toBe(1);
  //     expect(webhookEntity.waitUntil).toBeInstanceOf(Date);
  //   });

  //   it('should increase retriesCount by 1 if createSlash fails', async () => {
  //     jest
  //       .spyOn(paymentService, 'createSlash')
  //       .mockRejectedValueOnce(new Error());
  //     await service.processAbuse();

  //     expect(webhookRepository.updateOne).toHaveBeenCalled();
  //     expect(webhookEntity.status).toBe(WebhookStatus.PENDING);
  //     expect(webhookEntity.retriesCount).toBe(1);
  //     expect(webhookEntity.waitUntil).toBeInstanceOf(Date);
  //   });

  //   it('should mark webhook as failed if retriesCount exceeds threshold', async () => {
  //     jest
  //       .spyOn(jobService, 'processEscrowCancellation')
  //       .mockRejectedValueOnce(new Error());

  //     webhookEntity.retriesCount = MOCK_MAX_RETRY_COUNT;

  //     await service.processAbuse();

  //     expect(webhookRepository.updateOne).toHaveBeenCalled();
  //     expect(webhookEntity.status).toBe(WebhookStatus.FAILED);
  //   });

  //   it('should complete the cron job entity to unlock', async () => {
  //     jest
  //       .spyOn(service, 'completeCronJob')
  //       .mockResolvedValueOnce(cronJobEntityMock as any);

  //     await service.processAbuse();

  //     expect(service.completeCronJob).toHaveBeenCalledWith(
  //       cronJobEntityMock as any,
  //     );
  //   });
  // });
});
