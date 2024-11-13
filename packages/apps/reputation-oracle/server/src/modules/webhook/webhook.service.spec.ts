import { createMock } from '@golevelup/ts-jest';
import { ChainId } from '@human-protocol/sdk';
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
    webhookIncomingRepository: WebhookIncomingRepository,
    webhookOutgoingRepository: WebhookOutgoingRepository,
    httpService: HttpService,
    web3ConfigService: Web3ConfigService;

  const signerMock = {
    address: MOCK_ADDRESS,
    getNetwork: jest.fn().mockResolvedValue({ chainId: 1 }),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
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
        WebhookService,
        {
          provide: Web3Service,
          useValue: {
            getSigner: jest.fn().mockReturnValue(signerMock),
          },
        },
        {
          provide: WebhookIncomingRepository,
          useValue: createMock<WebhookIncomingRepository>(),
        },
        {
          provide: WebhookOutgoingRepository,
          useValue: createMock<WebhookOutgoingRepository>(),
        },
        Web3ConfigService,
        ServerConfigService,
        { provide: HttpService, useValue: createMock<HttpService>() },
      ],
    }).compile();

    webhookService = moduleRef.get<WebhookService>(WebhookService);
    webhookIncomingRepository = moduleRef.get(WebhookIncomingRepository);
    webhookOutgoingRepository = moduleRef.get(WebhookOutgoingRepository);
    httpService = moduleRef.get(HttpService);
    web3ConfigService = moduleRef.get(Web3ConfigService);

    jest
      .spyOn(web3ConfigService, 'privateKey', 'get')
      .mockReturnValue(MOCK_PRIVATE_KEY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createIncomingWebhook', () => {
    const webhookEntity: Partial<WebhookIncomingEntity> = {
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      status: WebhookIncomingStatus.PENDING,
      waitUntil: new Date(),
      retriesCount: 0,
    };

    it('should successfully create incoming webhook with valid DTO', async () => {
      const validDto: IncomingWebhookDto = {
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        eventType: EventType.JOB_COMPLETED,
      };

      jest
        .spyOn(webhookIncomingRepository, 'createUnique')
        .mockResolvedValue(webhookEntity as WebhookIncomingEntity);

      await webhookService.createIncomingWebhook(validDto);

      expect(webhookIncomingRepository.createUnique).toHaveBeenCalledWith(
        expect.any(Object),
      );
    });

    it('should throw NotFoundException if webhook entity not created', async () => {
      const validDto: IncomingWebhookDto = {
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        eventType: EventType.JOB_COMPLETED,
      };

      jest
        .spyOn(webhookIncomingRepository as any, 'createUnique')
        .mockResolvedValue(null);

      await expect(
        webhookService.createIncomingWebhook(validDto),
      ).rejects.toThrow(
        new ControlledError(ErrorWebhook.NotCreated, HttpStatus.NOT_FOUND),
      );
    });

    it('should throw BadRequestException with invalid event type', async () => {
      const invalidDto: IncomingWebhookDto = {
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        eventType: 'JOB_FAILED' as EventType,
      };

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
    it('should set incoming webhook status to FAILED if retries exceed threshold', async () => {
      const webhookEntity: Partial<WebhookIncomingEntity> = {
        id: 1,
        status: WebhookIncomingStatus.PENDING,
        retriesCount: MOCK_MAX_RETRY_COUNT,
      };
      await (webhookService as any).handleWebhookIncomingError(
        webhookEntity,
        new Error('Sample error'),
      );
      expect(webhookIncomingRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity.status).toBe(WebhookIncomingStatus.FAILED);
    });

    it('should increment retries count if below threshold', async () => {
      const webhookEntity: Partial<WebhookIncomingEntity> = {
        id: 1,
        status: WebhookIncomingStatus.PENDING,
        retriesCount: 0,
      };
      await (webhookService as any).handleWebhookIncomingError(
        webhookEntity,
        new Error('Sample error'),
      );
      expect(webhookIncomingRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity.status).toBe(WebhookIncomingStatus.PENDING);
      expect(webhookEntity.retriesCount).toBe(1);
      expect(webhookEntity.waitUntil).toBeInstanceOf(Date);
    });
  });

  describe('handleWebhookOutgoingError', () => {
    it('should set outgoing webhook status to FAILED if retries exceed threshold', async () => {
      const webhookEntity: Partial<WebhookOutgoingEntity> = {
        id: 1,
        status: WebhookOutgoingStatus.PENDING,
        retriesCount: MOCK_MAX_RETRY_COUNT,
      };
      await (webhookService as any).handleWebhookOutgoingError(
        webhookEntity,
        new Error('Sample error'),
      );
      expect(webhookOutgoingRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity.status).toBe(WebhookOutgoingStatus.FAILED);
    });

    it('should increment retries count if below threshold', async () => {
      const webhookEntity: Partial<WebhookOutgoingEntity> = {
        id: 1,
        status: WebhookOutgoingStatus.PENDING,
        retriesCount: 0,
      };
      await (webhookService as any).handleWebhookOutgoingError(
        webhookEntity,
        new Error('Sample error'),
      );
      expect(webhookOutgoingRepository.updateOne).toHaveBeenCalled();
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
});
