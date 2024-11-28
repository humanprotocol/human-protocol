import { createMock } from '@golevelup/ts-jest';
import { ChainId } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  MOCK_ADDRESS,
  MOCK_MAX_RETRY_COUNT,
  MOCK_PRIVATE_KEY,
  mockConfig,
} from '../../../test/constants';
import {
  EscrowCompletionTrackingStatus,
  EventType,
  WebhookIncomingStatus,
} from '../../common/enums/webhook';
import { Web3Service } from '../web3/web3.service';
import { WebhookIncomingRepository } from './webhook-incoming.repository';
import { WebhookOutgoingRepository } from './webhook-outgoing.repository';
import { WebhookIncomingService } from './webhook-incoming.service';
import { WebhookIncomingEntity } from './webhook-incoming.entity';
import { IncomingWebhookDto } from './webhook.dto';
import { ErrorWebhook } from '../../common/constants/errors';
import { HttpStatus } from '@nestjs/common';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ServerConfigService } from '../../common/config/server-config.service';
import { ControlledError } from '../../common/errors/controlled';
import { ReputationService } from '../reputation/reputation.service';
import { EscrowCompletionTrackingRepository } from '../escrow-completion-tracking/escrow-completion-tracking.repository';
import { EscrowCompletionTrackingService } from '../escrow-completion-tracking/escrow-completion-tracking.service';
import { PostgresErrorCodes } from '../../common/enums/database';
import { DatabaseError } from '../../common/errors/database';
import { WebhookOutgoingService } from './webhook-outgoing.service';
import { PayoutService } from '../payout/payout.service';
import { StorageService } from '../storage/storage.service';
import { ReputationRepository } from '../reputation/reputation.repository';
import { ReputationConfigService } from '../../common/config/reputation-config.service';
import { S3ConfigService } from '../../common/config/s3-config.service';
import { PGPConfigService } from '../../common/config/pgp-config.service';

describe('WebhookIncomingService', () => {
  let webhookIncomingService: WebhookIncomingService,
    webhookIncomingRepository: WebhookIncomingRepository,
    web3ConfigService: Web3ConfigService,
    escrowCompletionTrackingService: EscrowCompletionTrackingService,
    escrowCompletionTrackingRepository: EscrowCompletionTrackingRepository;

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
        WebhookIncomingService,
        WebhookOutgoingService,
        EscrowCompletionTrackingService,
        Web3ConfigService,
        ServerConfigService,
        PayoutService,
        ReputationService,
        HttpService,
        StorageService,
        ReputationConfigService,
        S3ConfigService,
        PGPConfigService,
        {
          provide: EscrowCompletionTrackingRepository,
          useValue: createMock<EscrowCompletionTrackingRepository>(),
        },
        {
          provide: WebhookOutgoingRepository,
          useValue: createMock<WebhookOutgoingRepository>(),
        },
        {
          provide: ReputationRepository,
          useValue: createMock<ReputationRepository>(),
        },
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
        { provide: HttpService, useValue: createMock<HttpService>() },
      ],
    }).compile();

    // Assign injected dependencies to variables
    webhookIncomingService = moduleRef.get<WebhookIncomingService>(
      WebhookIncomingService,
    );
    webhookIncomingRepository = moduleRef.get(WebhookIncomingRepository);
    escrowCompletionTrackingRepository = moduleRef.get(
      EscrowCompletionTrackingRepository,
    );
    escrowCompletionTrackingService =
      moduleRef.get<EscrowCompletionTrackingService>(
        EscrowCompletionTrackingService,
      );
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

      await webhookIncomingService.createIncomingWebhook(validDto);

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
        webhookIncomingService.createIncomingWebhook(validDto),
      ).rejects.toThrow(
        new ControlledError(ErrorWebhook.NotCreated, HttpStatus.NOT_FOUND),
      );
    });

    it('should throw BadRequestException with an invalid event type', async () => {
      await expect(
        webhookIncomingService.createIncomingWebhook(invalidDto),
      ).rejects.toThrow(
        new ControlledError(
          ErrorWebhook.InvalidEventType,
          HttpStatus.BAD_REQUEST,
        ),
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

      await (webhookIncomingService as any).handleWebhookIncomingError(
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

      await (webhookIncomingService as any).handleWebhookIncomingError(
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
        (webhookIncomingService as any).handleWebhookIncomingError(
          webhookEntity,
          new Error('Sample error'),
        ),
      ).rejects.toThrow('Database error');
    });

    it('should handle webhook error gracefully when retries count is zero', async () => {
      webhookEntity.retriesCount = 0;

      await (webhookIncomingService as any).handleWebhookIncomingError(
        webhookEntity,
        new Error('Network failure'),
      );

      expect(webhookEntity.status).toBe(WebhookIncomingStatus.PENDING);
      expect(webhookEntity.retriesCount).toBe(1);
      expect(webhookEntity.waitUntil).toBeInstanceOf(Date);
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
      await webhookIncomingService.processPendingIncomingWebhooks();

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
      await webhookIncomingService.processPendingIncomingWebhooks();

      expect(webhookIncomingRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity1.status).toBe(WebhookIncomingStatus.PENDING);
      expect(webhookEntity1.retriesCount).toBe(1);
      expect(webhookEntity1.waitUntil).toBeInstanceOf(Date);
    });

    it('should mark webhook as failed if retriesCount exceeds threshold', async () => {
      createEscrowCompletionTrackingMock.mockRejectedValueOnce(new Error());

      webhookEntity1.retriesCount = MOCK_MAX_RETRY_COUNT;

      await webhookIncomingService.processPendingIncomingWebhooks();

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

      await webhookIncomingService.processPendingIncomingWebhooks();

      expect(createEscrowCompletionTrackingMock).toHaveBeenCalled();
      expect(updateOneMock).not.toHaveBeenCalledWith({
        id: mockEntity.id,
        status: EscrowCompletionTrackingStatus.COMPLETED,
      });
    });
  });
});
