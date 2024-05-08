import { Test, TestingModule } from '@nestjs/testing';

import { CronJobType } from '../../common/enums/cron-job';

import { CronJobService } from './cron-job.service';
import { CronJobRepository } from './cron-job.repository';
import { CronJobEntity } from './cron-job.entity';
import { createMock } from '@golevelup/ts-jest';
import {
  MOCK_ADDRESS,
  MOCK_FILE_URL,
  MOCK_MAX_RETRY_COUNT,
  MOCK_WEBHOOK_URL,
} from '../../../test/constants';
import { ChainId } from '@human-protocol/sdk';
import { WebhookService } from '../webhook/webhook.service';
import { Web3Service } from '../web3/web3.service';
import { ConfigService } from '@nestjs/config';
import { WebhookIncomingEntity } from '../webhook/webhook-incoming.entity';
import { EventType, WebhookStatus } from '../../common/enums/webhook';
import { WebhookRepository } from '../webhook/webhook.repository';
import { PayoutService } from '../payout/payout.service';
import { ReputationService } from '../reputation/reputation.service';
import { StorageService } from '../storage/storage.service';
import { ReputationRepository } from '../reputation/reputation.repository';
import { HttpService } from '@nestjs/axios';
import { ServerConfigService } from '../../common/config/server-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ReputationConfigService } from '../../common/config/reputation-config.service';
import { AbuseRepository } from '../abuse/abuse.repository';
import { AbuseService } from '../abuse/abuse.service';
import { UserRepository } from '../user/user.repository';
import { SlackConfigService } from '../../common/config/slack-config.service';
import { AbuseEntity } from '../abuse/abuse.entity';
import { AbuseDecision, AbuseStatus } from '../../common/enums/abuse';

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
    })),
  },
  KVStoreClient: {
    build: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
    })),
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
    abuseRepository: AbuseRepository,
    abuseService: AbuseService,
    webhookRepository: WebhookRepository,
    webhookService: WebhookService,
    userRepository: UserRepository,
    reputationService: ReputationService,
    payoutService: PayoutService;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronJobService,
        {
          provide: CronJobRepository,
          useValue: createMock<CronJobRepository>(),
        },
        {
          provide: AbuseRepository,
          useValue: createMock<AbuseRepository>(),
        },
        {
          provide: UserRepository,
          useValue: createMock<UserRepository>(),
        },
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
            validateChainId: jest.fn().mockReturnValue(new Error()),
            calculateGasPrice: jest.fn().mockReturnValue(1000n),
          },
        },
        AbuseService,
        WebhookService,
        PayoutService,
        ReputationService,
        ConfigService,
        ServerConfigService,
        Web3ConfigService,
        ReputationConfigService,
        SlackConfigService,
        { provide: HttpService, useValue: createMock<HttpService>() },
        {
          provide: WebhookRepository,
          useValue: createMock<WebhookRepository>(),
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
    payoutService = module.get<PayoutService>(PayoutService);
    reputationService = module.get<ReputationService>(ReputationService);
    abuseRepository = module.get<AbuseRepository>(AbuseRepository);
    abuseService = module.get<AbuseService>(AbuseService);
    userRepository = module.get<UserRepository>(UserRepository);
    webhookRepository = module.get<WebhookRepository>(WebhookRepository);
    webhookService = module.get<WebhookService>(WebhookService);
  });

  describe('startCronJob', () => {
    it('should create a cron job if not exists', async () => {
      const cronJobType = CronJobType.ProcessPendingWebhook;

      const cronJobEntity = new CronJobEntity();
      cronJobEntity.cronJobType = cronJobType;
      cronJobEntity.startedAt = new Date();

      jest.spyOn(repository, 'findOneByType').mockResolvedValue(null);

      const createUniqueSpy = jest
        .spyOn(repository, 'createUnique')
        .mockResolvedValue(cronJobEntity);

      const result = await service.startCronJob(cronJobType);

      expect(createUniqueSpy).toHaveBeenCalledWith({
        cronJobType: CronJobType.ProcessPendingWebhook,
      });
      expect(result).toEqual(cronJobEntity);
    });

    it('should start a cron job if exists', async () => {
      const cronJobType = CronJobType.ProcessPendingWebhook;
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
      const cronJobType = CronJobType.ProcessPendingWebhook;
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
      const cronJobType = CronJobType.ProcessPendingWebhook;
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
      const cronJobType = CronJobType.ProcessPendingWebhook;
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
      const cronJobType = CronJobType.ProcessPendingWebhook;
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
      const cronJobType = CronJobType.ProcessPendingWebhook;
      const cronJobEntity = new CronJobEntity();
      cronJobEntity.cronJobType = cronJobType;
      cronJobEntity.completedAt = new Date();

      const updateOneSpy = jest
        .spyOn(repository, 'updateOne')
        .mockResolvedValue(cronJobEntity);

      await expect(service.completeCronJob(cronJobEntity)).rejects.toThrow();
      expect(updateOneSpy).not.toHaveBeenCalled();
    });
  });

  describe('processPendingCronJob', () => {
    let executePayoutsMock: any;
    let cronJobEntityMock: Partial<CronJobEntity>;
    let webhookEntity1: Partial<WebhookIncomingEntity>,
      webhookEntity2: Partial<WebhookIncomingEntity>;

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
        .spyOn(webhookRepository, 'findByStatus')
        .mockResolvedValue([webhookEntity1 as any, webhookEntity2 as any]);

      executePayoutsMock = jest.spyOn(payoutService as any, 'executePayouts');
      executePayoutsMock.mockResolvedValue(true);

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

      expect(executePayoutsMock).toHaveBeenCalledTimes(2);
      expect(executePayoutsMock).toHaveBeenCalledWith(
        webhookEntity1.chainId,
        webhookEntity1.escrowAddress,
      );
      expect(executePayoutsMock).toHaveBeenCalledWith(
        webhookEntity2.chainId,
        webhookEntity2.escrowAddress,
      );

      expect(webhookRepository.updateOne).toHaveBeenCalledTimes(2);
      expect(webhookEntity1.status).toBe(WebhookStatus.PAID);
      expect(webhookEntity2.status).toBe(WebhookStatus.PAID);
    });

    it('should increase retriesCount by 1 if sending webhook fails', async () => {
      executePayoutsMock.mockRejectedValueOnce(new Error());
      await service.processPendingWebhooks();

      expect(webhookRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity1.status).toBe(WebhookStatus.PENDING);
      expect(webhookEntity1.retriesCount).toBe(1);
      expect(webhookEntity1.waitUntil).toBeInstanceOf(Date);
    });

    it('should mark webhook as failed if retriesCount exceeds threshold', async () => {
      executePayoutsMock.mockRejectedValueOnce(new Error());

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

  describe('processPaidCronJob', () => {
    let assessReputationScoresMock: any;
    let cronJobEntityMock: Partial<CronJobEntity>;
    let webhookEntity1: Partial<WebhookIncomingEntity>,
      webhookEntity2: Partial<WebhookIncomingEntity>;

    beforeEach(() => {
      cronJobEntityMock = {
        cronJobType: CronJobType.ProcessPaidWebhook,
        startedAt: new Date(),
      };

      webhookEntity1 = {
        id: 1,
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        status: WebhookStatus.PAID,
        waitUntil: new Date(),
        retriesCount: 0,
      };

      webhookEntity2 = {
        id: 2,
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        status: WebhookStatus.PAID,
        waitUntil: new Date(),
        retriesCount: 0,
      };

      jest
        .spyOn(webhookRepository, 'findByStatus')
        .mockResolvedValue([webhookEntity1 as any, webhookEntity2 as any]);

      assessReputationScoresMock = jest.spyOn(
        reputationService as any,
        'assessReputationScores',
      );
      assessReputationScoresMock.mockResolvedValue(true);

      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(false);

      jest.spyOn(repository, 'findOneByType').mockResolvedValue(null);
      jest
        .spyOn(repository, 'createUnique')
        .mockResolvedValue(cronJobEntityMock as any);

      jest.spyOn(webhookService, 'sendWebhook').mockResolvedValue();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should not run if cron job is already running', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValueOnce(true);

      const startCronJobMock = jest.spyOn(service, 'startCronJob');

      await service.processPaidWebhooks();

      expect(startCronJobMock).not.toHaveBeenCalled();
    });

    it('should create cron job entity to lock the process', async () => {
      jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.processPaidWebhooks();

      expect(service.startCronJob).toHaveBeenCalledWith(
        CronJobType.ProcessPaidWebhook,
      );
    });

    it('should send webhook for all of the paid webhooks', async () => {
      await service.processPaidWebhooks();

      expect(assessReputationScoresMock).toHaveBeenCalledTimes(2);
      expect(assessReputationScoresMock).toHaveBeenCalledWith(
        webhookEntity1.chainId,
        webhookEntity1.escrowAddress,
      );
      expect(assessReputationScoresMock).toHaveBeenCalledWith(
        webhookEntity2.chainId,
        webhookEntity2.escrowAddress,
      );

      expect(webhookRepository.updateOne).toHaveBeenCalledTimes(2);
      expect(webhookEntity1.status).toBe(WebhookStatus.COMPLETED);
      expect(webhookEntity2.status).toBe(WebhookStatus.COMPLETED);
      expect(webhookService.sendWebhook).toHaveBeenCalledWith(
        MOCK_WEBHOOK_URL,
        {
          chainId: webhookEntity1.chainId,
          escrowAddress: webhookEntity1.escrowAddress,
          eventType: EventType.ESCROW_COMPLETED,
        },
      );
      expect(webhookService.sendWebhook).toHaveBeenCalledWith(
        MOCK_WEBHOOK_URL,
        {
          chainId: webhookEntity2.chainId,
          escrowAddress: webhookEntity2.escrowAddress,
          eventType: EventType.ESCROW_COMPLETED,
        },
      );
    });

    it('should increase retriesCount by 1 if sending webhook fails', async () => {
      assessReputationScoresMock.mockRejectedValueOnce(new Error());
      await service.processPaidWebhooks();

      expect(webhookRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity1.status).toBe(WebhookStatus.PAID);
      expect(webhookEntity1.retriesCount).toBe(1);
      expect(webhookEntity1.waitUntil).toBeInstanceOf(Date);
    });

    it('should mark webhook as failed if retriesCount exceeds threshold', async () => {
      assessReputationScoresMock.mockRejectedValueOnce(new Error());

      webhookEntity1.retriesCount = MOCK_MAX_RETRY_COUNT;

      await service.processPaidWebhooks();

      expect(webhookRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity1.status).toBe(WebhookStatus.FAILED);
    });

    it('should complete the cron job entity to unlock', async () => {
      jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.processPaidWebhooks();

      expect(service.completeCronJob).toHaveBeenCalledWith(
        cronJobEntityMock as any,
      );
    });
  });

  describe('processAbuseRequests', () => {
    let cronJobEntityMock: Partial<CronJobEntity>;
    let abuseEntity1: Partial<AbuseEntity>, abuseEntity2: Partial<AbuseEntity>;

    beforeEach(() => {
      cronJobEntityMock = {
        cronJobType: CronJobType.ProcessRequestedAbuse,
        startedAt: new Date(),
      };

      abuseEntity1 = {
        id: 1,
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        status: AbuseStatus.PENDING,
        waitUntil: new Date(),
        retriesCount: 0,
      };

      abuseEntity2 = {
        id: 2,
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        status: AbuseStatus.PENDING,
        waitUntil: new Date(),
        retriesCount: 0,
      };

      jest
        .spyOn(abuseRepository, 'findByStatus')
        .mockResolvedValue([abuseEntity1 as any, abuseEntity2 as any]);

      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(false);

      jest.spyOn(repository, 'findOneByType').mockResolvedValue(null);
      jest
        .spyOn(repository, 'createUnique')
        .mockResolvedValue(cronJobEntityMock as any);
      jest.spyOn(webhookService, 'sendWebhook').mockResolvedValue();
      jest.spyOn(abuseService, 'sendSlackNotification').mockResolvedValue();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should not run if cron job is already running', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValueOnce(true);

      const startCronJobMock = jest.spyOn(service, 'startCronJob');

      await service.processAbuseRequests();

      expect(startCronJobMock).not.toHaveBeenCalled();
    });

    it('should create cron job entity to lock the process', async () => {
      jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.processAbuseRequests();

      expect(service.startCronJob).toHaveBeenCalledWith(
        CronJobType.ProcessRequestedAbuse,
      );
    });

    it('should send webhook for all of the pending webhooks', async () => {
      await service.processAbuseRequests();

      expect(abuseRepository.updateOne).toHaveBeenCalledTimes(2);
      expect(abuseEntity1.status).toBe(AbuseStatus.NOTIFIED);
      expect(abuseEntity2.status).toBe(AbuseStatus.NOTIFIED);
    });

    it('should increase retriesCount by 1 if sending webhook fails', async () => {
      jest.spyOn(webhookService, 'sendWebhook').mockRejectedValue(new Error());
      await service.processAbuseRequests();

      expect(abuseRepository.updateOne).toHaveBeenCalled();
      expect(abuseEntity1.status).toBe(AbuseStatus.PENDING);
      expect(abuseEntity1.retriesCount).toBe(1);
      expect(abuseEntity1.waitUntil).toBeInstanceOf(Date);
    });

    it('should mark webhook as failed if retriesCount exceeds threshold', async () => {
      jest.spyOn(webhookService, 'sendWebhook').mockRejectedValue(new Error());
      abuseEntity1.retriesCount = MOCK_MAX_RETRY_COUNT;

      await service.processAbuseRequests();

      expect(abuseRepository.updateOne).toHaveBeenCalled();
      expect(abuseEntity1.status).toBe(AbuseStatus.FAILED);
    });

    it('should complete the cron job entity to unlock', async () => {
      jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.processAbuseRequests();

      expect(service.completeCronJob).toHaveBeenCalledWith(
        cronJobEntityMock as any,
      );
    });
  });

  describe('processClassifiedAbuses', () => {
    let cronJobEntityMock: Partial<CronJobEntity>;
    let abuseEntity1: Partial<AbuseEntity>, abuseEntity2: Partial<AbuseEntity>;

    beforeEach(() => {
      cronJobEntityMock = {
        cronJobType: CronJobType.ProcessClassifiedAbuse,
        startedAt: new Date(),
      };

      abuseEntity1 = {
        id: 1,
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        status: AbuseStatus.NOTIFIED,
        decision: AbuseDecision.ACCEPTED,
        waitUntil: new Date(),
        retriesCount: 0,
      };

      abuseEntity2 = {
        id: 2,
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        status: AbuseStatus.NOTIFIED,
        decision: AbuseDecision.REJECTED,
        waitUntil: new Date(),
        retriesCount: 0,
      };

      jest
        .spyOn(abuseRepository, 'findClassified')
        .mockResolvedValue([abuseEntity1 as any, abuseEntity2 as any]);

      jest.spyOn(service, 'isCronJobRunning').mockResolvedValue(false);

      jest.spyOn(repository, 'findOneByType').mockResolvedValue(null);
      jest
        .spyOn(userRepository, 'findById')
        .mockResolvedValue({ evmAddress: MOCK_ADDRESS } as any);
      jest
        .spyOn(repository, 'createUnique')
        .mockResolvedValue(cronJobEntityMock as any);
      jest.spyOn(webhookService, 'sendWebhook').mockResolvedValue();
      jest.spyOn(abuseService, 'slashAccount').mockResolvedValue();
      jest.spyOn(reputationService, 'decreaseReputation').mockResolvedValue();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should not run if cron job is already running', async () => {
      jest.spyOn(service, 'isCronJobRunning').mockResolvedValueOnce(true);

      const startCronJobMock = jest.spyOn(service, 'startCronJob');

      await service.processClassifiedAbuses();

      expect(startCronJobMock).not.toHaveBeenCalled();
    });

    it('should create cron job entity to lock the process', async () => {
      jest
        .spyOn(service, 'startCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.processClassifiedAbuses();

      expect(service.startCronJob).toHaveBeenCalledWith(
        CronJobType.ProcessClassifiedAbuse,
      );
    });

    it('should send webhook for all of the pending webhooks', async () => {
      await service.processClassifiedAbuses();

      expect(abuseRepository.updateOne).toHaveBeenCalledTimes(2);
      expect(abuseEntity1.status).toBe(AbuseStatus.COMPLETED);
      expect(abuseEntity2.status).toBe(AbuseStatus.COMPLETED);

      expect(abuseService.slashAccount).toHaveBeenCalled();
      expect(reputationService.decreaseReputation).toHaveBeenCalled();
      expect(webhookService.sendWebhook).toHaveBeenCalledWith(
        MOCK_WEBHOOK_URL,
        {
          chainId: ChainId.LOCALHOST,
          escrowAddress: MOCK_ADDRESS,
          eventType: EventType.ABUSE,
        },
      );
      expect(webhookService.sendWebhook).toHaveBeenCalledWith(
        MOCK_WEBHOOK_URL,
        {
          chainId: ChainId.LOCALHOST,
          escrowAddress: MOCK_ADDRESS,
          eventType: EventType.RESUME_ABUSE,
        },
      );
    });

    it('should increase retriesCount by 1 if sending webhook fails', async () => {
      jest.spyOn(webhookService, 'sendWebhook').mockRejectedValue(new Error());
      await service.processClassifiedAbuses();

      expect(abuseRepository.updateOne).toHaveBeenCalled();
      expect(abuseEntity1.status).toBe(AbuseStatus.NOTIFIED);
      expect(abuseEntity1.retriesCount).toBe(1);
      expect(abuseEntity1.waitUntil).toBeInstanceOf(Date);
    });

    it('should mark webhook as failed if retriesCount exceeds threshold', async () => {
      jest.spyOn(webhookService, 'sendWebhook').mockRejectedValue(new Error());
      abuseEntity1.retriesCount = MOCK_MAX_RETRY_COUNT;

      await service.processClassifiedAbuses();

      expect(abuseRepository.updateOne).toHaveBeenCalled();
      expect(abuseEntity1.status).toBe(AbuseStatus.FAILED);
    });

    it('should complete the cron job entity to unlock', async () => {
      jest
        .spyOn(service, 'completeCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await service.processClassifiedAbuses();

      expect(service.completeCronJob).toHaveBeenCalledWith(
        cronJobEntityMock as any,
      );
    });
  });
});
