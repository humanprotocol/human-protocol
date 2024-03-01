import { createMock } from '@golevelup/ts-jest';
import { ChainId } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  MOCK_ADDRESS,
  MOCK_MAX_RETRY_COUNT,
  MOCK_PRIVATE_KEY,
} from '../../../test/constants';
import { EventType, WebhookStatus } from '../../common/enums/webhook';
import { Web3Service } from '../web3/web3.service';
import { WebhookRepository } from './webhook.repository';
import { WebhookService } from './webhook.service';
import { WebhookIncomingEntity } from './webhook-incoming.entity';
import { WebhookIncomingDto } from './webhook.dto';
import { ErrorWebhook } from '../../common/constants/errors';

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
  let webhookService: WebhookService, webhookRepository: WebhookRepository;

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
      ],
    }).compile();

    webhookService = moduleRef.get<WebhookService>(WebhookService);
    webhookRepository = moduleRef.get(WebhookRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createIncomingWebhook', () => {
    const webhookEntity: Partial<WebhookIncomingEntity> = {
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      status: WebhookStatus.PENDING,
      waitUntil: new Date(),
      retriesCount: 0,
    };

    it('should successfully create incoming webhook with valid DTO', async () => {
      const validDto: WebhookIncomingDto = {
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        eventType: EventType.TASK_COMPLETED,
      };

      jest
        .spyOn(webhookRepository, 'findOne')
        .mockResolvedValueOnce(webhookEntity as WebhookIncomingEntity);

      await webhookService.createIncomingWebhook(validDto);

      expect(webhookRepository.create).toHaveBeenCalled();
      expect(webhookEntity.status).toBe(WebhookStatus.PENDING);
      expect(webhookEntity.retriesCount).toBe(0);
      expect(webhookEntity.waitUntil).toBeInstanceOf(Date);
    });

    it('should throw BadRequestException with invalid event type', async () => {
      const invalidDto: WebhookIncomingDto = {
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        eventType: 'INVALID_EVENT' as EventType,
      };

      await expect(
        webhookService.createIncomingWebhook(invalidDto),
      ).rejects.toThrow(ErrorWebhook.InvalidEventType);
    });

    it('should throw NotFoundException if webhook entity not created', async () => {
      const validDto: WebhookIncomingDto = {
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        eventType: EventType.TASK_COMPLETED,
      };

      jest.spyOn(webhookRepository as any, 'create').mockResolvedValue(null);

      await expect(
        webhookService.createIncomingWebhook(validDto),
      ).rejects.toThrow(ErrorWebhook.NotCreated);
    });
  });

  describe('handleWebhookError', () => {
    it('should set webhook status to FAILED if retries exceed threshold', async () => {
      const webhookEntity: Partial<WebhookIncomingEntity> = {
        id: 1,
        status: WebhookStatus.PENDING,
        retriesCount: MOCK_MAX_RETRY_COUNT,
      };
      await (webhookService as any).handleWebhookError(
        webhookEntity,
        new Error('Sample error'),
      );
      expect(webhookRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity.status).toBe(WebhookStatus.FAILED);
    });

    it('should increment retries count if below threshold', async () => {
      const webhookEntity: Partial<WebhookIncomingEntity> = {
        id: 1,
        status: WebhookStatus.PENDING,
        retriesCount: 0,
      };
      await (webhookService as any).handleWebhookError(
        webhookEntity,
        new Error('Sample error'),
      );
      expect(webhookRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity.status).toBe(WebhookStatus.PENDING);
      expect(webhookEntity.retriesCount).toBe(1);
      expect(webhookEntity.waitUntil).toBeInstanceOf(Date);
    });
  });
});
