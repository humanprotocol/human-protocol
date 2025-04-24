import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import * as crypto from 'crypto';
import stringify from 'json-stable-stringify';

import {
  createHttpServiceMock,
  createHttpServiceResponse,
} from '../../../test/mock-creators/nest';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';
import { ServerConfigService } from '../../config/server-config.service';
import { Web3ConfigService } from '../../config/web3-config.service';
import { transformKeysFromCamelToSnake } from '../../utils/case-converters';
import { signMessage } from '../../utils/web3';
import { mockWeb3ConfigService } from '../web3/fixtures';
import {
  generateOutgoingWebhookPayload,
  generateOutgoingWebhook,
} from './fixtures';
import { OutgoingWebhookStatus } from './types';
import { OutgoingWebhookRepository } from './webhook-outgoing.repository';
import { OutgoingWebhookService } from './webhook-outgoing.service';

const mockServerConfigService = {
  maxRetryCount: 1,
};

const mockOutgoingWebhookRepository = createMock<OutgoingWebhookRepository>();
const mockHttpService = createHttpServiceMock();

describe('WebhookOutgoingService', () => {
  let outgoingWebhookService: OutgoingWebhookService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        OutgoingWebhookService,
        {
          provide: ServerConfigService,
          useValue: mockServerConfigService,
        },
        {
          provide: OutgoingWebhookRepository,
          useValue: mockOutgoingWebhookRepository,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        { provide: Web3ConfigService, useValue: mockWeb3ConfigService },
      ],
    }).compile();

    outgoingWebhookService = moduleRef.get<OutgoingWebhookService>(
      OutgoingWebhookService,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createOutgoingWebhook', () => {
    it('should create outgoing webhook', async () => {
      const payload = generateOutgoingWebhookPayload();
      const url = faker.internet.url();

      const hash = crypto
        .createHash('sha1')
        .update(stringify({ payload, url }) as string)
        .digest('hex');

      await outgoingWebhookService.createOutgoingWebhook(payload, url);

      expect(mockOutgoingWebhookRepository.createUnique).toHaveBeenCalledTimes(
        1,
      );
      expect(mockOutgoingWebhookRepository.createUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          payload,
          hash,
          url,
          status: OutgoingWebhookStatus.PENDING,
        }),
      );
    });
  });

  describe('processPendingOutgoingWebhooks', () => {
    let spyOnSendWebhook: jest.SpyInstance;

    beforeAll(() => {
      spyOnSendWebhook = jest
        .spyOn(outgoingWebhookService, 'sendWebhook')
        .mockImplementation();
    });

    afterAll(() => {
      spyOnSendWebhook.mockRestore();
    });

    it('should process pending webhooks', async () => {
      const outgoingWebhookEntity = generateOutgoingWebhook();

      mockOutgoingWebhookRepository.findByStatus.mockResolvedValueOnce([
        outgoingWebhookEntity,
      ]);

      spyOnSendWebhook.mockResolvedValueOnce(null);

      await outgoingWebhookService.processPendingOutgoingWebhooks();

      expect(outgoingWebhookService.sendWebhook).toHaveBeenCalledTimes(1);
      expect(outgoingWebhookService.sendWebhook).toHaveBeenCalledWith(
        outgoingWebhookEntity,
      );

      expect(mockOutgoingWebhookRepository.updateOne).toHaveBeenCalledTimes(1);
      expect(mockOutgoingWebhookRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: outgoingWebhookEntity.id,
          status: OutgoingWebhookStatus.SENT,
        }),
      );
    });

    it('should increase retries count in case of an error', async () => {
      const outgoingWebhookEntity = generateOutgoingWebhook();

      mockOutgoingWebhookRepository.findByStatus.mockResolvedValueOnce([
        outgoingWebhookEntity,
      ]);
      spyOnSendWebhook.mockRejectedValueOnce(new Error());

      await outgoingWebhookService.processPendingOutgoingWebhooks();

      expect(mockOutgoingWebhookRepository.updateOne).toHaveBeenCalledTimes(1);
      expect(mockOutgoingWebhookRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: outgoingWebhookEntity.id,
          status: outgoingWebhookEntity.status,
          retriesCount: 1,
        }),
      );
    });

    it('should set failed status if retries count exceeds the limit', async () => {
      const outgoingWebhookEntity = generateOutgoingWebhook({
        retriesCount: 1,
      });

      mockOutgoingWebhookRepository.findByStatus.mockResolvedValueOnce([
        outgoingWebhookEntity,
      ]);
      spyOnSendWebhook.mockRejectedValueOnce(new Error());

      await outgoingWebhookService.processPendingOutgoingWebhooks();

      expect(mockOutgoingWebhookRepository.updateOne).toHaveBeenCalledTimes(1);
      expect(mockOutgoingWebhookRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: outgoingWebhookEntity.id,
          status: OutgoingWebhookStatus.FAILED,
        }),
      );
    });
  });

  describe('sendWebhook', () => {
    it('should send a webhook with correct parameters', async () => {
      const outgoingWebhookEntity = generateOutgoingWebhook();

      const expectedPayload = transformKeysFromCamelToSnake(
        outgoingWebhookEntity.payload,
      ) as object;
      const expectedSignature = await signMessage(
        expectedPayload,
        mockWeb3ConfigService.privateKey,
      );

      mockHttpService.post.mockReturnValueOnce(
        createHttpServiceResponse(200, {}),
      );

      await outgoingWebhookService.sendWebhook(outgoingWebhookEntity);

      expect(mockHttpService.post).toHaveBeenCalledTimes(1);
      expect(mockHttpService.post).toHaveBeenCalledWith(
        outgoingWebhookEntity.url,
        expectedPayload,
        { headers: { [HEADER_SIGNATURE_KEY]: expectedSignature } },
      );
    });
  });
});
