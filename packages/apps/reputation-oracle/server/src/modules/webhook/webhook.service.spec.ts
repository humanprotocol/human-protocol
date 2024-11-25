import { createMock } from '@golevelup/ts-jest';
import { ChainId, EscrowClient, EscrowStatus } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  MOCK_ADDRESS,
  MOCK_FILE_HASH,
  MOCK_FILE_URL,
  MOCK_MAX_RETRY_COUNT,
  MOCK_PRIVATE_KEY,
  MOCK_WEBHOOK_URL,
  mockConfig,
} from '../../../test/constants';
import {
  EscrowCompletionTrackingStatus,
  EventType,
  WebhookIncomingStatus,
  WebhookOutgoingStatus,
} from '../../common/enums/webhook';
import { Web3Service } from '../web3/web3.service';
import { WebhookIncomingRepository } from './webhook-incoming.repository';
import { WebhookOutgoingRepository } from './webhook-outgoing.repository';
import { WebhookService } from './webhook.service';
import { WebhookIncomingEntity } from './webhook-incoming.entity';
import { WebhookOutgoingEntity } from './webhook-outgoing.entity';
import { IncomingWebhookDto } from './webhook.dto';
import { ErrorWebhook } from '../../common/constants/errors';
import { of } from 'rxjs';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';
import { signMessage } from '../../common/utils/signature';
import { HttpStatus } from '@nestjs/common';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ServerConfigService } from '../../common/config/server-config.service';
import { ControlledError } from '../../common/errors/controlled';
import { PayoutService } from '../payout/payout.service';
import { ReputationService } from '../reputation/reputation.service';
import { EscrowCompletionTrackingRepository } from '../escrow-completion-tracking/escrow-completion-tracking.repository';
import { EscrowCompletionTrackingService } from '../escrow-completion-tracking/escrow-completion-tracking.service';
import { ReputationConfigService } from '../../common/config/reputation-config.service';
import { ReputationRepository } from '../reputation/reputation.repository';
import { StorageService } from '../storage/storage.service';
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

describe('WebhookService', () => {
  let webhookService: WebhookService;
  let webhookIncomingRepository: WebhookIncomingRepository;
  let webhookOutgoingRepository: WebhookOutgoingRepository;
  let httpService: HttpService;
  let web3ConfigService: Web3ConfigService;
  let escrowCompletionTrackingService: EscrowCompletionTrackingService;
  let escrowCompletionTrackingRepository: EscrowCompletionTrackingRepository;
  let reputationService: ReputationService;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  // Mock ConfigService to return the mock configuration values
  const mockConfigService = {
    get: jest.fn((key: string) => mockConfig[key]),
    getOrThrow: jest.fn((key: string) => {
      if (!mockConfig[key])
        throw new Error(`Configuration key "${key}" does not exist`);
      return mockConfig[key];
    }),
  };

  // Mock Web3Service
  const mockWeb3Service = {
    getSigner: jest.fn().mockReturnValue(signerMock),
    validateChainId: jest.fn().mockReturnValue(new Error()),
    calculateGasPrice: jest.fn().mockReturnValue(1000n),
    getOperatorAddress: jest.fn().mockReturnValue(MOCK_ADDRESS),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        WebhookService,
        EscrowCompletionTrackingService,
        PayoutService,
        ReputationService,
        Web3ConfigService,
        ServerConfigService,
        ReputationConfigService,
        HttpService,
        StorageService,

        // Mocked services
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: Web3Service,
          useValue: mockWeb3Service,
        },
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
        {
          provide: ReputationRepository,
          useValue: createMock<ReputationRepository>(),
        },
        { provide: HttpService, useValue: createMock<HttpService>() },
        { provide: StorageService, useValue: createMock<StorageService>() },
      ],
    }).compile();

    // Assign injected dependencies to variables
    webhookService = moduleRef.get<WebhookService>(WebhookService);
    webhookIncomingRepository = moduleRef.get(WebhookIncomingRepository);
    webhookOutgoingRepository = moduleRef.get(WebhookOutgoingRepository);
    escrowCompletionTrackingRepository = moduleRef.get(
      EscrowCompletionTrackingRepository,
    );
    reputationService = moduleRef.get<ReputationService>(ReputationService);
    escrowCompletionTrackingService =
      moduleRef.get<EscrowCompletionTrackingService>(
        EscrowCompletionTrackingService,
      );
    httpService = moduleRef.get(HttpService);
    web3ConfigService = moduleRef.get(Web3ConfigService);

    // Mocking privateKey getter
    jest
      .spyOn(web3ConfigService, 'privateKey', 'get')
      .mockReturnValue(MOCK_PRIVATE_KEY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createIncomingWebhook', () => {
    const validDto: IncomingWebhookDto = {
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      eventType: EventType.JOB_COMPLETED,
    };

    const invalidDto: IncomingWebhookDto = {
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      eventType: 'JOB_FAILED' as EventType,
    };

    const webhookEntity: Partial<WebhookIncomingEntity> = {
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      status: WebhookIncomingStatus.PENDING,
      waitUntil: new Date(),
      retriesCount: 0,
    };

    it('should successfully create an incoming webhook with valid DTO', async () => {
      jest
        .spyOn(webhookIncomingRepository, 'createUnique')
        .mockResolvedValue(webhookEntity as WebhookIncomingEntity);

      await webhookService.createIncomingWebhook(validDto);

      expect(webhookIncomingRepository.createUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: validDto.chainId,
          escrowAddress: validDto.escrowAddress,
        }),
      );
    });

    it('should throw NotFoundException if webhook entity creation fails', async () => {
      jest
        .spyOn(webhookIncomingRepository as any, 'createUnique')
        .mockResolvedValue(null);

      await expect(
        webhookService.createIncomingWebhook(validDto),
      ).rejects.toThrow(
        new ControlledError(ErrorWebhook.NotCreated, HttpStatus.NOT_FOUND),
      );
    });

    it('should throw BadRequestException with an invalid event type', async () => {
      await expect(
        webhookService.createIncomingWebhook(invalidDto),
      ).rejects.toThrow(
        new ControlledError(
          ErrorWebhook.InvalidEventType,
          HttpStatus.BAD_REQUEST,
        ),
      );
    });
  });

  describe('createOutgoingWebhook', () => {
    const payload = {
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      eventType: EventType.ESCROW_COMPLETED,
      waitUntil: new Date(),
      retriesCount: 0,
    };

    const url = MOCK_FILE_URL;
    const hash = MOCK_FILE_HASH;

    const webhookEntity: Partial<WebhookOutgoingEntity> = {
      payload,
      url: MOCK_FILE_URL,
      hash: MOCK_FILE_HASH,
      status: WebhookOutgoingStatus.PENDING,
    };

    it('should successfully create outgoing webhook with valid DTO', async () => {
      jest
        .spyOn(webhookOutgoingRepository, 'createUnique')
        .mockResolvedValue(webhookEntity as WebhookOutgoingEntity);

      await webhookService.createOutgoingWebhook(payload, url, hash);

      expect(webhookOutgoingRepository.createUnique).toHaveBeenCalledWith(
        expect.any(Object),
      );
    });
  });

  describe('handleWebhookIncomingError', () => {
    let webhookEntity: Partial<WebhookIncomingEntity>;

    beforeEach(() => {
      webhookEntity = {
        id: 1,
        status: WebhookIncomingStatus.PENDING,
        retriesCount: 0,
      };
    });

    it('should set incoming webhook status to FAILED if retries exceed threshold', async () => {
      webhookEntity.retriesCount = MOCK_MAX_RETRY_COUNT;

      await (webhookService as any).handleWebhookIncomingError(
        webhookEntity,
        new Error('Sample error'),
      );

      expect(webhookIncomingRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: webhookEntity.id,
          status: WebhookIncomingStatus.FAILED,
        }),
      );
      expect(webhookEntity.status).toBe(WebhookIncomingStatus.FAILED);
    });

    it('should increment retries count if below threshold', async () => {
      webhookEntity.retriesCount = 0;

      await (webhookService as any).handleWebhookIncomingError(
        webhookEntity,
        new Error('Sample error'),
      );

      expect(webhookIncomingRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: webhookEntity.id,
          status: WebhookIncomingStatus.PENDING,
          retriesCount: 1,
        }),
      );
      expect(webhookEntity.status).toBe(WebhookIncomingStatus.PENDING);
      expect(webhookEntity.retriesCount).toBe(1);
      expect(webhookEntity.waitUntil).toBeInstanceOf(Date);
    });

    it('should throw an error if the update operation fails', async () => {
      jest
        .spyOn(webhookIncomingRepository, 'updateOne')
        .mockRejectedValue(new Error('Database error'));

      await expect(
        (webhookService as any).handleWebhookIncomingError(
          webhookEntity,
          new Error('Sample error'),
        ),
      ).rejects.toThrow('Database error');
    });

    it('should handle webhook error gracefully when retries count is zero', async () => {
      webhookEntity.retriesCount = 0;

      await (webhookService as any).handleWebhookIncomingError(
        webhookEntity,
        new Error('Network failure'),
      );

      expect(webhookEntity.status).toBe(WebhookIncomingStatus.PENDING);
      expect(webhookEntity.retriesCount).toBe(1);
      expect(webhookEntity.waitUntil).toBeInstanceOf(Date);
    });
  });

  describe('handleWebhookOutgoingError', () => {
    let webhookEntity: Partial<WebhookOutgoingEntity>;

    beforeEach(() => {
      webhookEntity = {
        id: 1,
        status: WebhookOutgoingStatus.PENDING,
        retriesCount: 0,
      };
    });

    it('should set outgoing webhook status to FAILED if retries exceed threshold', async () => {
      webhookEntity.retriesCount = MOCK_MAX_RETRY_COUNT;
      await (webhookService as any).handleWebhookOutgoingError(
        webhookEntity,
        new Error('Sample error'),
      );
      expect(webhookOutgoingRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: webhookEntity.id,
          status: WebhookOutgoingStatus.FAILED,
        }),
      );
      expect(webhookEntity.status).toBe(WebhookOutgoingStatus.FAILED);
    });

    it('should increment retries count and set waitUntil if retries are below threshold', async () => {
      webhookEntity.retriesCount = 0;
      await (webhookService as any).handleWebhookOutgoingError(
        webhookEntity,
        new Error('Sample error'),
      );
      expect(webhookOutgoingRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: webhookEntity.id,
          status: WebhookOutgoingStatus.PENDING,
          retriesCount: 1,
        }),
      );
      expect(webhookEntity.status).toBe(WebhookOutgoingStatus.PENDING);
      expect(webhookEntity.retriesCount).toBe(1);
      expect(webhookEntity.waitUntil).toBeInstanceOf(Date);
    });

    it('should throw an error if the update operation fails', async () => {
      jest
        .spyOn(webhookOutgoingRepository, 'updateOne')
        .mockRejectedValue(new Error('Database error'));
      await expect(
        (webhookService as any).handleWebhookOutgoingError(
          webhookEntity,
          new Error('Sample error'),
        ),
      ).rejects.toThrow('Database error');
    });

    it('should handle webhook outgoing error gracefully when retries count is zero', async () => {
      webhookEntity.retriesCount = 0;
      await (webhookService as any).handleWebhookOutgoingError(
        webhookEntity,
        new Error('Network failure'),
      );
      expect(webhookEntity.status).toBe(WebhookOutgoingStatus.PENDING);
      expect(webhookEntity.retriesCount).toBe(1);
      expect(webhookEntity.waitUntil).toBeInstanceOf(Date);
    });
  });

  describe('sendWebhook', () => {
    const payload = {
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      eventType: EventType.ESCROW_COMPLETED,
    };

    it('should successfully send a webhook', async () => {
      jest.spyOn(httpService as any, 'post').mockImplementation(() => {
        return of({
          status: HttpStatus.CREATED,
        });
      });
      expect(await webhookService.sendWebhook(MOCK_WEBHOOK_URL, payload)).toBe(
        undefined,
      );

      const expectedBody = {
        chain_id: payload.chainId,
        escrow_address: payload.escrowAddress,
        event_type: payload.eventType,
      };

      expect(httpService.post).toHaveBeenCalledWith(
        MOCK_WEBHOOK_URL,
        expectedBody,
        {
          headers: {
            [HEADER_SIGNATURE_KEY]: await signMessage(
              expectedBody,
              MOCK_PRIVATE_KEY,
            ),
          },
        },
      );
    });
    it('should return an error if there is no response', async () => {
      jest.spyOn(httpService as any, 'post').mockImplementation(() => {
        return of({});
      });
      await expect(
        webhookService.sendWebhook(MOCK_WEBHOOK_URL, payload),
      ).rejects.toThrow(
        new ControlledError(ErrorWebhook.NotSent, HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('processPendingIncomingWebhooks', () => {
    let createEscrowCompletionTrackingMock: any;
    let webhookEntity1: Partial<WebhookIncomingEntity>,
      webhookEntity2: Partial<WebhookIncomingEntity>;

    beforeEach(() => {
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
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should send webhook for all of the pending incoming webhooks', async () => {
      await webhookService.processPendingIncomingWebhooks();

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
      await webhookService.processPendingIncomingWebhooks();

      expect(webhookIncomingRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity1.status).toBe(WebhookIncomingStatus.PENDING);
      expect(webhookEntity1.retriesCount).toBe(1);
      expect(webhookEntity1.waitUntil).toBeInstanceOf(Date);
    });

    it('should mark webhook as failed if retriesCount exceeds threshold', async () => {
      createEscrowCompletionTrackingMock.mockRejectedValueOnce(new Error());

      webhookEntity1.retriesCount = MOCK_MAX_RETRY_COUNT;

      await webhookService.processPendingIncomingWebhooks();

      expect(webhookIncomingRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity1.status).toBe(WebhookIncomingStatus.FAILED);
    });

    it('should handle duplicate errors when creating escrow completion tracking and not update entity status', async () => {
      const mockEntity = { id: 1, status: EscrowCompletionTrackingStatus.PAID };

      jest
        .spyOn(escrowCompletionTrackingRepository, 'findByStatus')
        .mockResolvedValue([mockEntity as any]);

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

      await webhookService.processPendingIncomingWebhooks();

      expect(createEscrowCompletionTrackingMock).toHaveBeenCalled();
      expect(updateOneMock).not.toHaveBeenCalledWith({
        id: mockEntity.id,
        status: EscrowCompletionTrackingStatus.COMPLETED,
      });
    });
  });

  describe('processPendingEscrowCompletion', () => {
    it('should save results and execute paypouts for all of the pending escrows completion', async () => {
      const mockEntity = {
        id: 1,
        status: EscrowCompletionTrackingStatus.PENDING,
      };
      jest
        .spyOn(escrowCompletionTrackingRepository, 'findByStatus')
        .mockResolvedValue([mockEntity as any]);

      const updateOneMock = jest
        .spyOn(escrowCompletionTrackingRepository, 'updateOne')
        .mockResolvedValue(mockEntity as any);

      await webhookService.processPendingEscrowCompletion();

      expect(updateOneMock).toHaveBeenCalled();
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
        })
        .mockResolvedValue(mockEntity2 as any);

      await webhookService.processPendingEscrowCompletion();
    });
  });

  describe('processPaidEscrowCompletion', () => {
    let assessReputationScoresMock: jest.SpyInstance;
    let createOutgoingWebhookMock: jest.SpyInstance;

    beforeEach(() => {
      assessReputationScoresMock = jest
        .spyOn(reputationService, 'assessReputationScores')
        .mockResolvedValue();

      createOutgoingWebhookMock = jest
        .spyOn(webhookService, 'createOutgoingWebhook')
        .mockResolvedValue();

      EscrowClient.build = jest.fn().mockResolvedValue({
        getStatus: jest.fn().mockResolvedValue(EscrowStatus.Paid),
        complete: jest.fn().mockResolvedValue(true),
        getJobLauncherAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
        getExchangeOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
        getRecordingOracleAddress: jest.fn().mockResolvedValue(MOCK_ADDRESS),
      });
    });

    it('should assess reputation scores and create outgoing webhook for all of the paid escrows completion', async () => {
      const mockEntity = { id: 1, status: EscrowCompletionTrackingStatus.PAID };

      jest
        .spyOn(escrowCompletionTrackingRepository, 'findByStatus')
        .mockResolvedValue([mockEntity as any]);

      const updateOneMock = jest
        .spyOn(escrowCompletionTrackingRepository, 'updateOne')
        .mockResolvedValue(mockEntity as any);

      await webhookService.processPaidEscrowCompletion();

      expect(updateOneMock).toHaveBeenCalledWith({
        id: mockEntity.id,
        status: EscrowCompletionTrackingStatus.COMPLETED,
      });
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

      await webhookService.processPaidEscrowCompletion();

      expect(updateOneMock).toHaveBeenCalledTimes(3);
      expect(assessReputationScoresMock).toHaveBeenCalledTimes(2);
    });

    it('should handle duplicate errors when creating outgoing webhooks and not update entity status', async () => {
      const mockEntity = { id: 1, status: EscrowCompletionTrackingStatus.PAID };

      jest
        .spyOn(escrowCompletionTrackingRepository, 'findByStatus')
        .mockResolvedValue([mockEntity as any]);

      const updateOneMock = jest
        .spyOn(escrowCompletionTrackingRepository, 'updateOne')
        .mockResolvedValue(mockEntity as any);

      createOutgoingWebhookMock = jest
        .spyOn(webhookService, 'createOutgoingWebhook')
        .mockImplementation(() => {
          throw new DatabaseError(
            'Duplicate entry error',
            PostgresErrorCodes.Duplicated,
          );
        });

      await webhookService.processPaidEscrowCompletion();

      expect(createOutgoingWebhookMock).toHaveBeenCalled();
      expect(updateOneMock).not.toHaveBeenCalledWith({
        id: mockEntity.id,
        status: EscrowCompletionTrackingStatus.COMPLETED,
      });
    });
  });

  describe('processPendingOutgoingWebhooks', () => {
    let sendWebhookMock: any;
    let webhookEntity1: Partial<WebhookOutgoingEntity>,
      webhookEntity2: Partial<WebhookOutgoingEntity>;

    beforeEach(() => {
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

      sendWebhookMock = jest.spyOn(webhookService as any, 'sendWebhook');
      sendWebhookMock.mockResolvedValue();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should increase retriesCount by 1 if sending webhook fails', async () => {
      sendWebhookMock.mockRejectedValueOnce(new Error());
      await webhookService.processPendingOutgoingWebhooks();

      expect(webhookOutgoingRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity1.status).toBe(WebhookOutgoingStatus.PENDING);
      expect(webhookEntity1.retriesCount).toBe(1);
      expect(webhookEntity1.waitUntil).toBeInstanceOf(Date);
    });

    it('should mark webhook as failed if retriesCount exceeds threshold', async () => {
      sendWebhookMock.mockRejectedValueOnce(new Error());

      webhookEntity1.retriesCount = MOCK_MAX_RETRY_COUNT;

      await webhookService.processPendingOutgoingWebhooks();

      expect(webhookOutgoingRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity1.status).toBe(WebhookOutgoingStatus.FAILED);
    });
  });
});
