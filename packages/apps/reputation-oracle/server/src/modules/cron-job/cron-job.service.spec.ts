import { Test, TestingModule } from '@nestjs/testing';

import { CronJobType } from '../../common/enums/cron-job';

import { CronJobService } from './cron-job.service';
import { CronJobRepository } from './cron-job.repository';
import { CronJobEntity } from './cron-job.entity';
import { createMock } from '@golevelup/ts-jest';
import {
  MOCK_ADDRESS,
  MOCK_FILE_HASH,
  MOCK_FILE_URL,
  MOCK_MAX_RETRY_COUNT,
  MOCK_WEBHOOK_URL,
  mockConfig,
} from '../../../test/constants';
import { ChainId, EscrowClient, EscrowStatus } from '@human-protocol/sdk';
import { WebhookService } from '../webhook/webhook.service';
import { Web3Service } from '../web3/web3.service';
import { ConfigService } from '@nestjs/config';
import {
  EventType,
  WebhookIncomingStatus,
  WebhookOutgoingStatus,
  EscrowCompletionTrackingStatus,
} from '../../common/enums/webhook';
import { PayoutService } from '../payout/payout.service';
import { ReputationService } from '../reputation/reputation.service';
import { StorageService } from '../storage/storage.service';
import { ReputationRepository } from '../reputation/reputation.repository';
import { HttpService } from '@nestjs/axios';
import { ServerConfigService } from '../../common/config/server-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ReputationConfigService } from '../../common/config/reputation-config.service';
import { ControlledError } from '../../common/errors/controlled';
import { ErrorCronJob, ErrorWebhook } from '../../common/constants/errors';
import { HttpStatus } from '@nestjs/common';
import { WebhookOutgoingRepository } from '../webhook/webhook-outgoing.repository';
import { WebhookIncomingRepository } from '../webhook/webhook-incoming.repository';
import { WebhookIncomingEntity } from '../webhook/webhook-incoming.entity';
import { WebhookOutgoingEntity } from '../webhook/webhook-outgoing.entity';
import { EscrowCompletionTrackingRepository } from '../escrow-completion-tracking/escrow-completion-tracking.repository';
import { EscrowCompletionTrackingService } from '../escrow-completion-tracking/escrow-completion-tracking.service';
import { PostgresErrorCodes } from '../../common/enums/database';
import { DatabaseError } from '../../common/errors/database';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn().mockImplementation(() => ({
      createEscrow: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      getJobLauncherAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      getExchangeOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      getRecordingOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      setup: jest.fn().mockResolvedValue(null),
      fund: jest.fn().mockResolvedValue(null),
      getManifestUrl: jest.fn().mockResolvedValue(MOCK_FILE_URL),
      complete: jest.fn().mockResolvedValue(null),
      getStatus: jest.fn(),
    })),
  },
  KVStoreUtils: {
    get: jest.fn(),
  },
  OperatorUtils: {
    getLeader: jest.fn().mockImplementation(() => {
      return { webhookUrl: MOCK_WEBHOOK_URL };
    }),
  },
}));

describe('CronJobService', () => {
  let service: CronJobService,
    repository: CronJobRepository,
    webhookIncomingRepository: WebhookIncomingRepository,
    webhookOutgoingRepository: WebhookOutgoingRepository,
    escrowCompletionTrackingRepository: EscrowCompletionTrackingRepository,
    webhookService: WebhookService,
    escrowCompletionTrackingService: EscrowCompletionTrackingService,
    reputationService: ReputationService,
    payoutService: PayoutService;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key]),
            getOrThrow: jest.fn((key: string) => {
              if (!mockConfig[key]) {
                throw new Error(`Configuration key "${key}" does not exist`);
              }
              return mockConfig[key];
            }),
          },
        },
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
            calculateGasPrice: jest.fn().mockReturnValue(1000n),
          },
        },
        WebhookService,
        EscrowCompletionTrackingService,
        {
          provide: PayoutService,
          useValue: createMock<PayoutService>(),
        },
        ReputationService,
        ServerConfigService,
        Web3ConfigService,
        ReputationConfigService,
        { provide: HttpService, useValue: createMock<HttpService>() },

        {
          provide: WebhookIncomingRepository,
          useValue: createMock<WebhookIncomingRepository>(),
        },
        {
          provide: WebhookOutgoingRepository,
          useValue: createMock<WebhookOutgoingRepository>(),
        },
        {
          provide: EscrowCompletionTrackingRepository,
          useValue: createMock<EscrowCompletionTrackingRepository>(),
        },
        { provide: StorageService, useValue: createMock<StorageService>() },
        {
          provide: ReputationRepository,
          useValue: createMock<ReputationRepository>(),
        },
      ],
    }).compile();

    service = module.get<CronJobService>(CronJobService);
    repository = module.get<CronJobRepository>(CronJobRepository);
    reputationService = module.get<ReputationService>(ReputationService);
    webhookIncomingRepository = module.get(WebhookIncomingRepository);
    webhookOutgoingRepository = module.get(WebhookOutgoingRepository);
    escrowCompletionTrackingRepository = module.get(
      EscrowCompletionTrackingRepository,
    );
    payoutService = module.get(PayoutService);

    webhookService = module.get<WebhookService>(WebhookService);
    escrowCompletionTrackingService =
      module.get<EscrowCompletionTrackingService>(
        EscrowCompletionTrackingService,
      );
  });

  describe('startCronJob', () => {
    it('should create a cron job if not exists', async () => {
      const cronJobType = CronJobType.ProcessPendingIncomingWebhook;

      const cronJobEntity = new CronJobEntity();
      cronJobEntity.cronJobType = cronJobType;
      cronJobEntity.startedAt = new Date();

      jest.spyOn(repository, 'findOneByType').mockResolvedValue(null);

      const createUniqueSpy = jest
        .spyOn(repository, 'createUnique')
        .mockResolvedValue(cronJobEntity);

      const result = await service.startCronJob(cronJobType);

      expect(createUniqueSpy).toHaveBeenCalledWith({
        cronJobType: CronJobType.ProcessPendingIncomingWebhook,
      });
      expect(result).toEqual(cronJobEntity);
    });

    it('should start a cron job if exists', async () => {
      const cronJobType = CronJobType.ProcessPendingIncomingWebhook;
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
      const cronJobType = CronJobType.ProcessPendingIncomingWebhook;
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
      const cronJobType = CronJobType.ProcessPendingIncomingWebhook;
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
      const cronJobType = CronJobType.ProcessPendingIncomingWebhook;
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
      const cronJobType = CronJobType.ProcessPendingIncomingWebhook;
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
      const cronJobType = CronJobType.ProcessPendingIncomingWebhook;
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

  describe('processPendingIncomingWebhooksCronJob', () => {
    let createEscrowCompletionTrackingMock: any;
    let cronJobEntityMock: Partial<CronJobEntity>;
    let webhookEntity1: Partial<WebhookIncomingEntity>,
      webhookEntity2: Partial<WebhookIncomingEntity>;

    let completeCronJobMock: jest.SpyInstance;

    beforeEach(() => {
      completeCronJobMock = jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValue({} as CronJobEntity);

      cronJobEntityMock = {
        cronJobType: CronJobType.ProcessPendingIncomingWebhook,
        startedAt: new Date(),
      };

      webhookEntity1 = {
        id: 1,
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        status: WebhookIncomingStatus.PENDING,
        waitUntil: new Date(),
        retriesCount: 0,
      };

      webhookEntity2 = {
        id: 2,
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        status: WebhookIncomingStatus.PENDING,
        waitUntil: new Date(),
        retriesCount: 0,
      };

      jest
        .spyOn(webhookIncomingRepository, 'findByStatus')
        .mockResolvedValue([webhookEntity1 as any, webhookEntity2 as any]);

      createEscrowCompletionTrackingMock = jest.spyOn(
        escrowCompletionTrackingService as any,
        'createEscrowCompletionTracking',
      );
      createEscrowCompletionTrackingMock.mockResolvedValue(undefined);

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

      await service.processPendingIncomingWebhooks();

      expect(startCronJobMock).not.toHaveBeenCalled();
    });

    it('should create cron job entity to lock the process', async () => {
      jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.processPendingIncomingWebhooks();

      expect(service.startCronJob).toHaveBeenCalledWith(
        CronJobType.ProcessPendingIncomingWebhook,
      );
    });

    it('should send webhook for all of the pending incoming webhooks', async () => {
      await service.processPendingIncomingWebhooks();

      expect(createEscrowCompletionTrackingMock).toHaveBeenCalledTimes(2);
      expect(createEscrowCompletionTrackingMock).toHaveBeenCalledWith(
        webhookEntity1.chainId,
        webhookEntity1.escrowAddress,
      );
      expect(createEscrowCompletionTrackingMock).toHaveBeenCalledWith(
        webhookEntity2.chainId,
        webhookEntity2.escrowAddress,
      );

      expect(webhookIncomingRepository.updateOne).toHaveBeenCalledTimes(2);
      expect(webhookEntity1.status).toBe(WebhookIncomingStatus.COMPLETED);
      expect(webhookEntity2.status).toBe(WebhookIncomingStatus.COMPLETED);
    });

    it('should increase retriesCount by 1 if sending webhook fails', async () => {
      createEscrowCompletionTrackingMock.mockRejectedValueOnce(new Error());
      await service.processPendingIncomingWebhooks();

      expect(webhookIncomingRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity1.status).toBe(WebhookIncomingStatus.PENDING);
      expect(webhookEntity1.retriesCount).toBe(1);
      expect(webhookEntity1.waitUntil).toBeInstanceOf(Date);
    });

    it('should mark webhook as failed if retriesCount exceeds threshold', async () => {
      createEscrowCompletionTrackingMock.mockRejectedValueOnce(new Error());

      webhookEntity1.retriesCount = MOCK_MAX_RETRY_COUNT;

      await service.processPendingIncomingWebhooks();

      expect(webhookIncomingRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity1.status).toBe(WebhookIncomingStatus.FAILED);
    });

    it('should complete the cron job entity to unlock', async () => {
      jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.processPendingIncomingWebhooks();

      expect(service.completeCronJob).toHaveBeenCalledWith(
        cronJobEntityMock as any,
      );
    });

    it('should handle duplicate errors when creating escrow completion tracking and not update entity status', async () => {
      const mockEntity = { id: 1, status: EscrowCompletionTrackingStatus.PAID };

      const updateOneMock = jest
        .spyOn(escrowCompletionTrackingRepository, 'updateOne')
        .mockResolvedValue(mockEntity as any);

      const createEscrowCompletionTrackingMock = jest
        .spyOn(
          escrowCompletionTrackingService,
          'createEscrowCompletionTracking',
        )
        .mockImplementation(() => {
          throw new DatabaseError(
            'Duplicate entry error',
            PostgresErrorCodes.Duplicated,
          );
        });

      await service.processPendingIncomingWebhooks();

      expect(createEscrowCompletionTrackingMock).toHaveBeenCalled();
      expect(updateOneMock).not.toHaveBeenCalledWith({
        id: mockEntity.id,
        status: EscrowCompletionTrackingStatus.COMPLETED,
      });
      expect(completeCronJobMock).toHaveBeenCalled();
    });
  });

  describe('processPendingEscrowCompletion', () => {
    let startCronJobMock: jest.SpyInstance;
    let completeCronJobMock: jest.SpyInstance;

    beforeEach(() => {
      startCronJobMock = jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValue({} as CronJobEntity);
      completeCronJobMock = jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValue({} as CronJobEntity);

      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(false);

      EscrowClient.build = jest.fn().mockResolvedValue({
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Pending),
      });
    });

    it('should skip processing if a cron job is already running', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(true);

      await service.processPendingEscrowCompletion();

      expect(startCronJobMock).not.toHaveBeenCalled();
    });

    it('should start and complete the cron job successfully', async () => {
      const mockEntity = {
        id: 1,
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        status: EscrowCompletionTrackingStatus.PENDING,
      };
      jest
        .spyOn(escrowCompletionTrackingRepository, 'findByStatus')
        .mockResolvedValue([mockEntity as any]);

      const saveResultsMock = jest
        .spyOn(payoutService, 'saveResults')
        .mockResolvedValueOnce({ url: MOCK_FILE_URL, hash: MOCK_FILE_HASH });

      const updateOneMock = jest
        .spyOn(escrowCompletionTrackingRepository, 'updateOne')
        .mockResolvedValue(mockEntity as any);

      await service.processPendingEscrowCompletion();

      expect(startCronJobMock).toHaveBeenCalledWith(
        CronJobType.ProcessPendingEscrowCompletionTracking,
      );
      expect(saveResultsMock).toHaveBeenCalledWith(
        mockEntity.chainId,
        mockEntity.escrowAddress,
      );
      expect(payoutService.executePayouts).toHaveBeenCalledWith(
        mockEntity.chainId,
        mockEntity.escrowAddress,
        MOCK_FILE_URL,
        MOCK_FILE_HASH,
      );
      expect(updateOneMock).toHaveBeenCalledTimes(2);
      expect(completeCronJobMock).toHaveBeenCalled();
    });

    it('should handle errors and continue processing other entities', async () => {
      const mockEntity1 = {
        id: 1,
        status: EscrowCompletionTrackingStatus.PENDING,
      };
      const mockEntity2 = {
        id: 2,
        status: EscrowCompletionTrackingStatus.PENDING,
      };

      jest
        .spyOn(escrowCompletionTrackingRepository, 'findByStatus')
        .mockResolvedValue([mockEntity1 as any, mockEntity2 as any]);

      jest
        .spyOn(escrowCompletionTrackingRepository, 'updateOne')
        .mockImplementationOnce(() => {
          throw new Error('Test error');
        }) // Fails for mockEntity1
        .mockResolvedValue(mockEntity2 as any); // Succeeds for mockEntity2

      const handleErrorMock = jest.spyOn(
        escrowCompletionTrackingService,
        'handleEscrowCompletionTrackingError',
      );

      await service.processPendingEscrowCompletion();

      // Verify cron job completes
      expect(completeCronJobMock).toHaveBeenCalled();

      expect(handleErrorMock).toHaveBeenCalledWith(
        mockEntity1,
        expect.stringContaining(ErrorWebhook.PendingProcessingFailed),
      );

      // Ensure the second entity is processed successfully
      expect(escrowCompletionTrackingRepository.updateOne).toHaveBeenCalledWith(
        mockEntity2,
      );
    });
  });

  describe('processPaidEscrowCompletion', () => {
    let startCronJobMock: jest.SpyInstance;
    let completeCronJobMock: jest.SpyInstance;
    let assessReputationScoresMock: jest.SpyInstance;

    beforeEach(() => {
      startCronJobMock = jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValue({} as CronJobEntity);
      completeCronJobMock = jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValue({} as CronJobEntity);

      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(false);
      assessReputationScoresMock = jest
        .spyOn(reputationService, 'assessReputationScores')
        .mockResolvedValue();

      EscrowClient.build = jest.fn().mockResolvedValue({
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Paid),
        complete: jest.fn().mockResolvedValue(true),
        getJobLauncherAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
        getExchangeOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      });
    });

    it('should skip processing if a cron job is already running', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(true);

      await service.processPaidEscrowCompletion();

      expect(startCronJobMock).not.toHaveBeenCalled();
      expect(assessReputationScoresMock).not.toHaveBeenCalled();
    });

    it('should start, process, and complete cron job for entities with PAID status', async () => {
      const mockEntity = { id: 1, status: EscrowCompletionTrackingStatus.PAID };

      jest
        .spyOn(escrowCompletionTrackingRepository, 'findByStatus')
        .mockResolvedValue([mockEntity as any]);

      const updateOneMock = jest
        .spyOn(escrowCompletionTrackingRepository, 'updateOne')
        .mockResolvedValue(mockEntity as any);

      await service.processPaidEscrowCompletion();

      expect(startCronJobMock).toHaveBeenCalledWith(
        CronJobType.ProcessPaidEscrowCompletionTracking,
      );
      expect(updateOneMock).toHaveBeenCalledWith({
        id: mockEntity.id,
        status: EscrowCompletionTrackingStatus.COMPLETED,
      });
      expect(completeCronJobMock).toHaveBeenCalled();
      expect(assessReputationScoresMock).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during entity processing without skipping remaining entities', async () => {
      const mockEntity1 = {
        id: 1,
        status: EscrowCompletionTrackingStatus.PAID,
      };
      const mockEntity2 = {
        id: 2,
        status: EscrowCompletionTrackingStatus.PAID,
      };

      jest
        .spyOn(escrowCompletionTrackingRepository, 'findByStatus')
        .mockResolvedValue([mockEntity1 as any, mockEntity2 as any]);

      const updateOneMock = jest
        .spyOn(escrowCompletionTrackingRepository, 'updateOne')
        .mockImplementationOnce(() => {
          throw new Error('Test error');
        })
        .mockResolvedValueOnce(mockEntity2 as any);

      await service.processPaidEscrowCompletion();

      expect(updateOneMock).toHaveBeenCalledTimes(3);
      expect(completeCronJobMock).toHaveBeenCalled();
      expect(assessReputationScoresMock).toHaveBeenCalledTimes(2);
    });

    it('should complete cron job even if no PAID entities are found', async () => {
      jest
        .spyOn(escrowCompletionTrackingRepository, 'findByStatus')
        .mockResolvedValue([]);

      await service.processPaidEscrowCompletion();

      expect(startCronJobMock).toHaveBeenCalled();
      expect(completeCronJobMock).toHaveBeenCalled();
      expect(assessReputationScoresMock).not.toHaveBeenCalled();
    });

    it('should not call completeCronJob if startCronJob fails', async () => {
      startCronJobMock.mockRejectedValue(new Error('Start cron job failed'));

      await expect(service.processPaidEscrowCompletion()).rejects.toThrow(
        'Start cron job failed',
      );

      expect(startCronJobMock).toHaveBeenCalled();
      expect(completeCronJobMock).not.toHaveBeenCalled();
    });

    it('should handle duplicate errors when creating outgoing webhooks and not update entity status', async () => {
      const mockEntity = { id: 1, status: EscrowCompletionTrackingStatus.PAID };

      jest
        .spyOn(escrowCompletionTrackingRepository, 'findByStatus')
        .mockResolvedValue([mockEntity as any]);

      const updateOneMock = jest
        .spyOn(escrowCompletionTrackingRepository, 'updateOne')
        .mockResolvedValue(mockEntity as any);

      const createOutgoingWebhookMock = jest
        .spyOn(webhookService, 'createOutgoingWebhook')
        .mockImplementation(() => {
          throw new DatabaseError(
            'Duplicate entry error',
            PostgresErrorCodes.Duplicated,
          );
        });

      await service.processPaidEscrowCompletion();

      expect(createOutgoingWebhookMock).toHaveBeenCalled();
      expect(updateOneMock).not.toHaveBeenCalledWith({
        id: mockEntity.id,
        status: EscrowCompletionTrackingStatus.COMPLETED,
      });
      expect(completeCronJobMock).toHaveBeenCalled();
    });
  });

  describe('processPendingOutgoingWebhooks', () => {
    let sendWebhookMock: any;
    let cronJobEntityMock: Partial<CronJobEntity>;
    let webhookEntity1: Partial<WebhookOutgoingEntity>,
      webhookEntity2: Partial<WebhookOutgoingEntity>;

    beforeEach(() => {
      cronJobEntityMock = {
        cronJobType: CronJobType.ProcessPendingOutgoingWebhook,
        startedAt: new Date(),
      };

      webhookEntity1 = {
        id: 1,
        payload: {
          chainId: ChainId.LOCALHOST,
          escrowAddress: MOCK_ADDRESS,
          eventType: EventType.ESCROW_COMPLETED,
        },
        hash: MOCK_FILE_HASH,
        url: MOCK_FILE_URL,
        status: WebhookOutgoingStatus.PENDING,
        waitUntil: new Date(),
        retriesCount: 0,
      };

      webhookEntity2 = {
        id: 2,
        payload: {
          chainId: ChainId.LOCALHOST,
          escrowAddress: MOCK_ADDRESS,
          eventType: EventType.ESCROW_COMPLETED,
        },
        hash: MOCK_FILE_HASH,
        url: MOCK_FILE_URL,
        status: WebhookOutgoingStatus.PENDING,
        waitUntil: new Date(),
        retriesCount: 0,
      };

      jest
        .spyOn(webhookOutgoingRepository, 'findByStatus')
        .mockResolvedValue([webhookEntity1 as any, webhookEntity2 as any]);

      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(false);

      jest.spyOn(repository, 'findOneByType').mockResolvedValue(null);
      jest
        .spyOn(repository, 'createUnique')
        .mockResolvedValue(cronJobEntityMock as any);

      sendWebhookMock = jest.spyOn(webhookService as any, 'sendWebhook');
      sendWebhookMock.mockResolvedValue();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should not run if cron job is already running', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValueOnce(true);

      const startCronJobMock = jest.spyOn(service, 'startCronJob');

      await service.processPendingOutgoingWebhooks();

      expect(startCronJobMock).not.toHaveBeenCalled();
    });

    it('should create cron job entity to lock the process', async () => {
      jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.processPendingOutgoingWebhooks();

      expect(service.startCronJob).toHaveBeenCalledWith(
        CronJobType.ProcessPendingOutgoingWebhook,
      );
    });

    it('should increase retriesCount by 1 if sending webhook fails', async () => {
      sendWebhookMock.mockRejectedValueOnce(new Error());
      await service.processPendingOutgoingWebhooks();

      expect(webhookOutgoingRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity1.status).toBe(WebhookOutgoingStatus.PENDING);
      expect(webhookEntity1.retriesCount).toBe(1);
      expect(webhookEntity1.waitUntil).toBeInstanceOf(Date);
    });

    it('should mark webhook as failed if retriesCount exceeds threshold', async () => {
      sendWebhookMock.mockRejectedValueOnce(new Error());

      webhookEntity1.retriesCount = MOCK_MAX_RETRY_COUNT;

      await service.processPendingOutgoingWebhooks();

      expect(webhookOutgoingRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity1.status).toBe(WebhookOutgoingStatus.FAILED);
    });

    it('should complete the cron job entity to unlock', async () => {
      jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.processPendingOutgoingWebhooks();

      expect(service.completeCronJob).toHaveBeenCalledWith(
        cronJobEntityMock as any,
      );
    });
  });
});
