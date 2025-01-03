import * as crypto from 'crypto';
import stringify from 'json-stable-stringify';
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
import { of } from 'rxjs';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';
import { signMessage } from '../../common/utils/signature';
import { HttpStatus } from '@nestjs/common';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ServerConfigService } from '../../common/config/server-config.service';
import { OutgoingWebhookError, WebhookErrorMessage } from './webhook.error';

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

    const hash = crypto
      .createHash('sha1')
      .update(stringify({ payload, url }))
      .digest('hex');

    const webhookEntity: Partial<WebhookOutgoingEntity> = {
      payload,
      url,
      hash,
      status: WebhookOutgoingStatus.PENDING,
    };

    it('should successfully create outgoing webhook with valid DTO', async () => {
      jest
        .spyOn(webhookOutgoingRepository, 'createUnique')
        .mockResolvedValue(webhookEntity as WebhookOutgoingEntity);

      await webhookOutgoingService.createOutgoingWebhook(payload, url);

      expect(webhookOutgoingRepository.createUnique).toHaveBeenCalledWith({
        ...webhookEntity,
        waitUntil: expect.any(Date),
        retriesCount: 0,
      });
    });
  });

  describe('sendWebhook', () => {
    const payload = {
      chainId: ChainId.LOCALHOST,
      escrowAddress: MOCK_ADDRESS,
      eventType: EventType.ESCROW_COMPLETED,
    };
    const webhook: any = {
      hash: 'test',
      url: MOCK_WEBHOOK_URL,
      payload,
    };

    it('should successfully send a webhook', async () => {
      jest.spyOn(httpService as any, 'post').mockImplementation(() => {
        return of({
          status: HttpStatus.CREATED,
        });
      });
      expect(await webhookOutgoingService.sendWebhook(webhook)).toBe(undefined);

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
      await expect(webhookOutgoingService.sendWebhook(webhook)).rejects.toThrow(
        new OutgoingWebhookError(WebhookErrorMessage.NOT_SENT, webhook.hash),
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

    it('should mark the webhook as SENT when sending webhook succeeds', async () => {
      sendWebhookMock.mockResolvedValueOnce(undefined);

      await webhookOutgoingService.processPendingOutgoingWebhooks();

      expect(webhookOutgoingRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: webhookEntity1.id,
          status: WebhookOutgoingStatus.SENT,
        }),
      );
      expect(webhookEntity1.status).toBe(WebhookOutgoingStatus.SENT);
    });

    it('should increment retriesCount and set waitUntil when sending webhook fails', async () => {
      sendWebhookMock.mockRejectedValueOnce(new Error('Network error'));

      await webhookOutgoingService.processPendingOutgoingWebhooks();

      expect(webhookOutgoingRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: webhookEntity1.id,
          retriesCount: 1,
          waitUntil: expect.any(Date),
          status: WebhookOutgoingStatus.PENDING,
        }),
      );
      expect(webhookEntity1.retriesCount).toBe(1);
      expect(webhookEntity1.waitUntil).toBeInstanceOf(Date);
    });

    it('should mark webhook as FAILED if retry count exceeds threshold', async () => {
      const error = new Error('Random Error');
      const loggerErrorSpy = jest.spyOn(
        webhookOutgoingService['logger'],
        'error',
      );

      sendWebhookMock.mockRejectedValueOnce(error);

      webhookEntity1.retriesCount = MOCK_MAX_RETRY_COUNT;

      await webhookOutgoingService.processPendingOutgoingWebhooks();

      expect(webhookOutgoingRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          status: WebhookOutgoingStatus.FAILED,
        }),
      );
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Message: ${error.message}`),
      );
    });
  });
});
