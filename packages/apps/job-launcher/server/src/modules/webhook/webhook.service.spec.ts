import { createMock } from '@golevelup/ts-jest';
import { ChainId, EscrowClient, KVStoreClient } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  MOCK_ADDRESS,
  MOCK_EXCHANGE_ORACLE_ADDRESS,
  MOCK_EXCHANGE_ORACLE_WEBHOOK_URL,
  MOCK_MAX_RETRY_COUNT,
  MOCK_PRIVATE_KEY,
} from '../../../test/constants';
import { ErrorWebhook } from '../../common/constants/errors';
import {
  EventType,
  OracleType,
  WebhookStatus,
} from '../../common/enums/webhook';
import { Web3Service } from '../web3/web3.service';
import { WebhookDto } from './webhook.dto';
import { WebhookEntity } from './webhook.entity';
import { WebhookRepository } from './webhook.repository';
import { WebhookService } from './webhook.service';
import { of } from 'rxjs';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';
import { CronJobService } from '../cron-job/cron-job.service';
import { CronJobEntity } from '../cron-job/cron-job.entity';
import { CronJobType } from '../../common/enums/cron-job';

jest.mock('@human-protocol/sdk', () => ({
  ...jest.requireActual('@human-protocol/sdk'),
  EscrowClient: {
    build: jest.fn(),
  },
  KVStoreClient: {
    build: jest.fn(),
  },
}));

describe('WebhookService', () => {
  let webhookService: WebhookService,
    webhookRepository: WebhookRepository,
    web3Service: Web3Service,
    httpService: HttpService,
    cronJobService: CronJobService;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  beforeEach(async () => {
    const mockConfigService: Partial<ConfigService> = {
      get: jest.fn((key: string) => {
        switch (key) {
          case 'HOST':
            return '127.0.0.1';
          case 'PORT':
            return 5000;
          case 'WEB3_PRIVATE_KEY':
            return MOCK_PRIVATE_KEY;
          case 'MAX_RETRY_COUNT':
            return MOCK_MAX_RETRY_COUNT;
        }
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
        {
          provide: WebhookRepository,
          useValue: createMock<WebhookRepository>(),
        },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: createMock<HttpService>() },
        {
          provide: CronJobService,
          useValue: createMock<CronJobService>(),
        },
      ],
    }).compile();

    webhookService = moduleRef.get<WebhookService>(WebhookService);
    webhookRepository = moduleRef.get(WebhookRepository);
    web3Service = moduleRef.get<Web3Service>(Web3Service);
    httpService = moduleRef.get<HttpService>(HttpService);
    cronJobService = moduleRef.get<CronJobService>(CronJobService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWebhook', () => {
    const dto: WebhookDto = {
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      eventType: EventType.ESCROW_CREATED,
      oracleType: OracleType.FORTUNE,
      hasSignature: false,
    };

    it('should create a webhook entity', async () => {
      const webhookEntity: Partial<WebhookEntity> = {
        id: 1,
        chainId: dto.chainId,
        escrowAddress: dto.escrowAddress,
        status: WebhookStatus.PENDING,
        eventType: dto.eventType,
        oracleType: dto.oracleType,
        waitUntil: new Date(),
      };

      jest
        .spyOn(webhookRepository, 'create')
        .mockResolvedValueOnce(webhookEntity as WebhookEntity);

      const result = await webhookService.createWebhook(dto);

      expect(webhookRepository.create).toHaveBeenCalledWith({
        chainId: dto.chainId,
        escrowAddress: dto.escrowAddress,
        eventType: EventType.ESCROW_CREATED,
        hasSignature: false,
        oracleType: OracleType.FORTUNE,
        retriesCount: 0,
        status: WebhookStatus.PENDING,
        waitUntil: expect.any(Date),
      });
      expect(result).toBe(undefined);
    });

    it('should throw an error if incoming webhook entity is not created', async () => {
      jest
        .spyOn(webhookRepository, 'create')
        .mockResolvedValueOnce(undefined as any);

      await expect(webhookService.createWebhook(dto)).rejects.toThrowError(
        ErrorWebhook.NotCreated,
      );
    });

    it('should throw an error if an error occurs', async () => {
      jest
        .spyOn(webhookRepository, 'create')
        .mockRejectedValueOnce(new Error());

      await expect(webhookService.createWebhook(dto)).rejects.toThrowError();
    });
  });

  describe('sendWebhook', () => {
    const webhookEntity: Partial<WebhookEntity> = {
      id: 1,
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      status: WebhookStatus.PENDING,
      waitUntil: new Date(),
      hasSignature: false,
      oracleType: OracleType.FORTUNE,
      eventType: EventType.ESCROW_CREATED,
    };

    it('should throw an error if webhook url is empty', async () => {
      jest
        .spyOn(webhookService as any, 'getExchangeOracleWebhookUrl')
        .mockResolvedValue('');
      await expect(
        (webhookService as any).sendWebhook(webhookEntity),
      ).rejects.toThrowError(ErrorWebhook.UrlNotFound);
    });

    it('should handle error if any exception is thrown', async () => {
      jest
        .spyOn(webhookService as any, 'getExchangeOracleWebhookUrl')
        .mockResolvedValue(MOCK_EXCHANGE_ORACLE_WEBHOOK_URL);
      jest.spyOn(httpService as any, 'post').mockImplementation(() => {
        return of({
          data: undefined,
        });
      });
      await expect(
        (webhookService as any).sendWebhook(webhookEntity),
      ).rejects.toThrowError(ErrorWebhook.NotSent);
    });

    it('should successfully process a fortune webhook', async () => {
      jest
        .spyOn(webhookService as any, 'getExchangeOracleWebhookUrl')
        .mockResolvedValue(MOCK_EXCHANGE_ORACLE_WEBHOOK_URL);
      jest.spyOn(httpService as any, 'post').mockImplementation(() => {
        return of({
          data: true,
        });
      });
      expect(await (webhookService as any).sendWebhook(webhookEntity)).toBe(
        undefined,
      );

      expect(httpService.post).toHaveBeenCalledWith(
        MOCK_EXCHANGE_ORACLE_WEBHOOK_URL,
        {
          escrowAddress: webhookEntity.escrowAddress,
          chainId: webhookEntity.chainId,
          eventType: webhookEntity.eventType,
        },
        {},
      );
    });

    it('should successfully process a cvat webhook', async () => {
      webhookEntity.oracleType = OracleType.CVAT;
      jest
        .spyOn(webhookService as any, 'getExchangeOracleWebhookUrl')
        .mockResolvedValue(MOCK_EXCHANGE_ORACLE_WEBHOOK_URL);
      jest.spyOn(httpService as any, 'post').mockImplementation(() => {
        return of({
          data: true,
        });
      });
      expect(await (webhookService as any).sendWebhook(webhookEntity)).toBe(
        undefined,
      );

      expect(httpService.post).toHaveBeenCalledWith(
        MOCK_EXCHANGE_ORACLE_WEBHOOK_URL,
        {
          escrow_address: webhookEntity.escrowAddress,
          chain_id: webhookEntity.chainId,
          event_type: webhookEntity.eventType,
        },
        {},
      );
    });

    it('should successfully process a fortune webhook with signature', async () => {
      webhookEntity.oracleType = OracleType.FORTUNE;
      webhookEntity.hasSignature = true;
      jest
        .spyOn(webhookService as any, 'getExchangeOracleWebhookUrl')
        .mockResolvedValue(MOCK_EXCHANGE_ORACLE_WEBHOOK_URL);
      jest.spyOn(httpService as any, 'post').mockImplementation(() => {
        return of({
          data: true,
        });
      });
      expect(await (webhookService as any).sendWebhook(webhookEntity)).toBe(
        undefined,
      );

      expect(httpService.post).toHaveBeenCalledWith(
        MOCK_EXCHANGE_ORACLE_WEBHOOK_URL,
        {
          escrowAddress: webhookEntity.escrowAddress,
          chainId: webhookEntity.chainId,
          eventType: webhookEntity.eventType,
        },
        { headers: { [HEADER_SIGNATURE_KEY]: expect.any(String) } },
      );
    });

    it('should successfully process a cvat webhook with signature', async () => {
      webhookEntity.oracleType = OracleType.CVAT;
      webhookEntity.hasSignature = true;
      jest
        .spyOn(webhookService as any, 'getExchangeOracleWebhookUrl')
        .mockResolvedValue(MOCK_EXCHANGE_ORACLE_WEBHOOK_URL);
      jest.spyOn(httpService as any, 'post').mockImplementation(() => {
        return of({
          data: true,
        });
      });
      expect(await (webhookService as any).sendWebhook(webhookEntity)).toBe(
        undefined,
      );

      expect(httpService.post).toHaveBeenCalledWith(
        MOCK_EXCHANGE_ORACLE_WEBHOOK_URL,
        {
          escrow_address: webhookEntity.escrowAddress,
          chain_id: webhookEntity.chainId,
          event_type: webhookEntity.eventType,
        },
        { headers: { [HEADER_SIGNATURE_KEY]: expect.any(String) } },
      );
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
        .spyOn(webhookRepository, 'find')
        .mockResolvedValue([webhookEntity1 as any, webhookEntity2 as any]);

      sendWebhookMock = jest.spyOn(webhookService as any, 'sendWebhook');
      sendWebhookMock.mockResolvedValue(true);

      jest.spyOn(cronJobService, 'isCronJobRunning').mockResolvedValue(false);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should not run if cron job is already running', async () => {
      jest
        .spyOn(cronJobService, 'isCronJobRunning')
        .mockResolvedValueOnce(true);

      const startCronJobMock = jest.spyOn(cronJobService, 'startCronJob');

      await (webhookService as any).processPendingWebhooks();

      expect(startCronJobMock).not.toHaveBeenCalled();
    });

    it('should create cron job entity to lock the process', async () => {
      jest
        .spyOn(cronJobService, 'startCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await (webhookService as any).processPendingWebhooks();

      expect(cronJobService.startCronJob).toHaveBeenCalledWith(
        CronJobType.ProcessPendingWebhook,
      );
    });

    it('should send webhook for all of the pending webhooks', async () => {
      await (webhookService as any).processPendingWebhooks();

      expect(sendWebhookMock).toHaveBeenCalledTimes(2);
      expect(sendWebhookMock).toHaveBeenCalledWith(webhookEntity1);
      expect(sendWebhookMock).toHaveBeenCalledWith(webhookEntity2);

      expect(webhookRepository.updateOne).toHaveBeenCalledTimes(2);
      expect(webhookRepository.updateOne).toHaveBeenCalledWith(
        { id: webhookEntity1.id },
        { status: WebhookStatus.COMPLETED },
      );
      expect(webhookRepository.updateOne).toHaveBeenCalledWith(
        { id: webhookEntity2.id },
        { status: WebhookStatus.COMPLETED },
      );
    });

    it('should increase retriesCount by 1 if sending webhook fails', async () => {
      sendWebhookMock.mockRejectedValueOnce(new Error());

      await (webhookService as any).processPendingWebhooks();

      expect(webhookRepository.updateOne).toHaveBeenCalledWith(
        { id: webhookEntity1.id },
        {
          retriesCount: 1,
          waitUntil: expect.any(Date),
        },
      );
    });

    it('should mark webhook as failed if retriesCount exceeds threshold', async () => {
      sendWebhookMock.mockRejectedValueOnce(new Error());

      webhookEntity1.retriesCount = MOCK_MAX_RETRY_COUNT;

      await (webhookService as any).processPendingWebhooks();

      expect(webhookRepository.updateOne).toHaveBeenCalledWith(
        { id: webhookEntity1.id },
        { status: WebhookStatus.FAILED },
      );
    });

    it('should complete the cron job entity to unlock', async () => {
      jest
        .spyOn(cronJobService, 'completeCronJob')
        .mockResolvedValueOnce(cronJobEntityMock as any);

      await (webhookService as any).processPendingWebhooks();

      expect(cronJobService.completeCronJob).toHaveBeenCalledWith(
        cronJobEntityMock as any,
      );
    });
  });

  describe('getExchangeOracleWebhookUrl', () => {
    it('should get the exchange oracle webhook URL', async () => {
      web3Service.getSigner = jest.fn().mockReturnValue({
        ...signerMock,
        provider: {
          getLogs: jest.fn().mockResolvedValue([{}]),
          getBlockNumber: jest.fn().mockResolvedValue(100),
        },
      });

      (EscrowClient.build as any).mockImplementation(() => ({
        getExchangeOracleAddress: jest
          .fn()
          .mockResolvedValue(MOCK_EXCHANGE_ORACLE_ADDRESS),
      }));

      (KVStoreClient.build as any).mockImplementation(() => ({
        get: jest.fn().mockResolvedValue(MOCK_EXCHANGE_ORACLE_WEBHOOK_URL),
      }));

      const result = await (webhookService as any).getExchangeOracleWebhookUrl(
        MOCK_EXCHANGE_ORACLE_ADDRESS,
        ChainId.LOCALHOST,
      );

      expect(result).toBe(MOCK_EXCHANGE_ORACLE_WEBHOOK_URL);
    });
  });

  describe('handleWebhookError', () => {
    it('should set webhook status to FAILED if retries exceed threshold', async () => {
      await (webhookService as any).handleWebhookError(
        { id: 1, retriesCount: MOCK_MAX_RETRY_COUNT } as any,
        new Error('Sample error'),
      );
      expect(webhookRepository.updateOne).toHaveBeenCalledWith(
        { id: 1 },
        { status: WebhookStatus.FAILED },
      );
    });

    it('should increment retries count if below threshold', async () => {
      await (webhookService as any).handleWebhookError(
        { id: 1, retriesCount: 0 } as any,
        new Error('Sample error'),
      );
      expect(webhookRepository.updateOne).toHaveBeenCalledWith(
        { id: 1 },
        {
          retriesCount: 1,
          waitUntil: expect.any(Date),
        },
      );
    });
  });
});
