import { createMock } from '@golevelup/ts-jest';
import { ChainId } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  MOCK_ADDRESS,
  MOCK_MAX_RETRY_COUNT,
  MOCK_PRIVATE_KEY,
  MOCK_WEBHOOK_URL,
  mockConfig,
} from '../../../test/constants';
import {
  EventType,
  WebhookStatus,
  WebhookType,
} from '../../common/enums/webhook';
import { Web3Service } from '../web3/web3.service';
import { WebhookRepository } from './webhook.repository';
import { WebhookService } from './webhook.service';
import { WebhookEntity } from './webhook.entity';
import { SendWebhookDto, WebhookDto } from './webhook.dto';
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
    webhookRepository: WebhookRepository,
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
          provide: WebhookRepository,
          useValue: createMock<WebhookRepository>(),
        },
        Web3ConfigService,
        ServerConfigService,
        { provide: HttpService, useValue: createMock<HttpService>() },
      ],
    }).compile();

    webhookService = moduleRef.get<WebhookService>(WebhookService);
    webhookRepository = moduleRef.get(WebhookRepository);
    httpService = moduleRef.get(HttpService);
    web3ConfigService = moduleRef.get(Web3ConfigService);

    jest
      .spyOn(web3ConfigService, 'privateKey', 'get')
      .mockReturnValue(MOCK_PRIVATE_KEY);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWebhook', () => {
    const inWebhookEntity: Partial<WebhookEntity> = {
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      type: WebhookType.IN,
      status: WebhookStatus.PENDING,
      waitUntil: new Date(),
      retriesCount: 0,
    };

    const outWebhookEntity: Partial<WebhookEntity> = {
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      type: WebhookType.OUT,
      callbackUrl: MOCK_WEBHOOK_URL,
      status: WebhookStatus.PENDING,
      waitUntil: new Date(),
      retriesCount: 0,
    };

    it('should successfully create incoming webhook with valid DTO', async () => {
      const validDto: WebhookDto = {
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        type: WebhookType.IN,
        eventType: EventType.JOB_COMPLETED,
      };

      jest
        .spyOn(webhookRepository, 'createUnique')
        .mockResolvedValue(inWebhookEntity as WebhookEntity);

      await webhookService.createWebhook(validDto);

      expect(webhookRepository.createUnique).toHaveBeenCalledWith(
        expect.any(Object),
      );
    });

    it('should successfully create outgoing webhook with valid DTO', async () => {
      const validDto: WebhookDto = {
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        type: WebhookType.OUT,
        callbackUrl: MOCK_WEBHOOK_URL,
        eventType: EventType.JOB_COMPLETED,
      };

      jest
        .spyOn(webhookRepository, 'createUnique')
        .mockResolvedValue(outWebhookEntity as WebhookEntity);

      await webhookService.createWebhook(validDto);

      expect(webhookRepository.createUnique).toHaveBeenCalledWith(
        expect.any(Object),
      );
    });

    it('should throw NotFoundException if webhook entity not created', async () => {
      const validDto: WebhookDto = {
        chainId: ChainId.LOCALHOST,
        escrowAddress: MOCK_ADDRESS,
        type: WebhookType.IN,
        eventType: EventType.JOB_COMPLETED,
      };

      jest
        .spyOn(webhookRepository as any, 'createUnique')
        .mockResolvedValue(null);

      await expect(webhookService.createWebhook(validDto)).rejects.toThrow(
        new ControlledError(ErrorWebhook.NotCreated, HttpStatus.BAD_REQUEST),
      );
    });
  });

  describe('handleWebhookError', () => {
    it('should set webhook status to FAILED if retries exceed threshold', async () => {
      const webhookEntity: Partial<WebhookEntity> = {
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
      const webhookEntity: Partial<WebhookEntity> = {
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

  describe('sendWebhook', () => {
    const webhookBody: SendWebhookDto = {
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
      expect(
        await webhookService.sendWebhook(MOCK_WEBHOOK_URL, webhookBody),
      ).toBe(undefined);

      const expectedBody = {
        chain_id: webhookBody.chainId,
        escrow_address: webhookBody.escrowAddress,
        event_type: webhookBody.eventType,
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
        webhookService.sendWebhook(MOCK_WEBHOOK_URL, webhookBody),
      ).rejects.toThrow(
        new ControlledError(ErrorWebhook.NotSent, HttpStatus.BAD_REQUEST),
      );
    });
  });
});
