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
import { EventType, WebhookOutgoingStatus } from '../../common/enums/webhook';
import { Web3Service } from '../web3/web3.service';
import { WebhookOutgoingRepository } from './webhook-outgoing.repository';
import { WebhookOutgoingService } from './webhook-outgoing.service';
import { WebhookOutgoingEntity } from './webhook-outgoing.entity';
import { ErrorWebhook } from '../../common/constants/errors';
import { of } from 'rxjs';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';
import { signMessage } from '../../common/utils/signature';
import { HttpStatus } from '@nestjs/common';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ServerConfigService } from '../../common/config/server-config.service';
import { ControlledError } from '../../common/errors/controlled';

describe('WebhookOutgoingService', () => {
  let webhookOutgoingService: WebhookOutgoingService,
    webhookOutgoingRepository: WebhookOutgoingRepository,
    httpService: HttpService,
    web3ConfigService: Web3ConfigService;

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
        WebhookOutgoingService,
        Web3ConfigService,
        ServerConfigService,
        HttpService,
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
          provide: WebhookOutgoingRepository,
          useValue: createMock<WebhookOutgoingRepository>(),
        },
        { provide: HttpService, useValue: createMock<HttpService>() },
      ],
    }).compile();

    // Assign injected dependencies to variables
    webhookOutgoingService = moduleRef.get<WebhookOutgoingService>(
      WebhookOutgoingService,
    );
    webhookOutgoingRepository = moduleRef.get(WebhookOutgoingRepository);
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

  describe('createOutgoingWebhook', () => {
    const payload = {
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      eventType: EventType.ESCROW_COMPLETED,
      waitUntil: new Date(),
      retriesCount: 0,
    };

    const url = MOCK_FILE_URL;

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

      await webhookOutgoingService.createOutgoingWebhook(payload, url);

      expect(webhookOutgoingRepository.createUnique).toHaveBeenCalledWith(
        expect.any(Object),
      );
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
      await (webhookOutgoingService as any).handleWebhookOutgoingError(
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
      await (webhookOutgoingService as any).handleWebhookOutgoingError(
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
        (webhookOutgoingService as any).handleWebhookOutgoingError(
          webhookEntity,
          new Error('Sample error'),
        ),
      ).rejects.toThrow('Database error');
    });

    it('should handle webhook outgoing error gracefully when retries count is zero', async () => {
      webhookEntity.retriesCount = 0;
      await (webhookOutgoingService as any).handleWebhookOutgoingError(
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
      expect(
        await webhookOutgoingService.sendWebhook(MOCK_WEBHOOK_URL, payload),
      ).toBe(undefined);

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
        webhookOutgoingService.sendWebhook(MOCK_WEBHOOK_URL, payload),
      ).rejects.toThrow(
        new ControlledError(ErrorWebhook.NotSent, HttpStatus.BAD_REQUEST),
      );
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

      sendWebhookMock = jest.spyOn(
        webhookOutgoingService as any,
        'sendWebhook',
      );
      sendWebhookMock.mockResolvedValue();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should increase retriesCount by 1 if sending webhook fails', async () => {
      sendWebhookMock.mockRejectedValueOnce(new Error());
      await webhookOutgoingService.processPendingOutgoingWebhooks();

      expect(webhookOutgoingRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity1.status).toBe(WebhookOutgoingStatus.PENDING);
      expect(webhookEntity1.retriesCount).toBe(1);
      expect(webhookEntity1.waitUntil).toBeInstanceOf(Date);
    });

    it('should mark webhook as failed if retriesCount exceeds threshold', async () => {
      sendWebhookMock.mockRejectedValueOnce(new Error());

      webhookEntity1.retriesCount = MOCK_MAX_RETRY_COUNT;

      await webhookOutgoingService.processPendingOutgoingWebhooks();

      expect(webhookOutgoingRepository.updateOne).toHaveBeenCalled();
      expect(webhookEntity1.status).toBe(WebhookOutgoingStatus.FAILED);
    });
  });
});
