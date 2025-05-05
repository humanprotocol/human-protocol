import { faker } from '@faker-js/faker';
import { createMock } from '@golevelup/ts-jest';
import { Test } from '@nestjs/testing';

import {
  DatabaseError,
  DatabaseErrorMessages,
} from '../../common/errors/database';
import { ServerConfigService } from '../../config';
import { EscrowCompletionService } from '../escrow-completion/escrow-completion.service';
import { generateTestnetChainId } from '../web3/fixtures';

import { generateIncomingWebhook } from './fixtures';
import {
  IncomingWebhookData,
  IncomingWebhookEventType,
  IncomingWebhookStatus,
} from './types';
import { IncomingWebhookRepository } from './webhook-incoming.repository';
import { IncomingWebhookService } from './webhook-incoming.service';

const mockServerConfigService = {
  maxRetryCount: 1,
};

const mockEscrowCompletionService = createMock<EscrowCompletionService>();
const mockIncomingWebhookRepository = createMock<IncomingWebhookRepository>();

describe('WebhookIncomingService', () => {
  let incomingWebhookService: IncomingWebhookService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        IncomingWebhookService,
        {
          provide: ServerConfigService,
          useValue: mockServerConfigService,
        },
        {
          provide: EscrowCompletionService,
          useValue: mockEscrowCompletionService,
        },
        {
          provide: IncomingWebhookRepository,
          useValue: mockIncomingWebhookRepository,
        },
      ],
    }).compile();

    incomingWebhookService = moduleRef.get<IncomingWebhookService>(
      IncomingWebhookService,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createIncomingWebhook', () => {
    it('should create an incoming webhook', async () => {
      const data: IncomingWebhookData = {
        chainId: generateTestnetChainId(),
        eventType: IncomingWebhookEventType.JOB_COMPLETED,
        escrowAddress: faker.finance.ethereumAddress(),
      };

      await incomingWebhookService.createIncomingWebhook(data);

      expect(mockIncomingWebhookRepository.createUnique).toHaveBeenCalledTimes(
        1,
      );
      expect(mockIncomingWebhookRepository.createUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          chainId: data.chainId,
          escrowAddress: data.escrowAddress,
          status: IncomingWebhookStatus.PENDING,
          retriesCount: 0,
        }),
      );
    });
  });

  describe('processPendingIncomingWebhooks', () => {
    it('should process pending webhooks', async () => {
      const incomingWebhookEntity = generateIncomingWebhook();

      mockIncomingWebhookRepository.findByStatus.mockResolvedValueOnce([
        incomingWebhookEntity,
      ]);

      await incomingWebhookService.processPendingIncomingWebhooks();

      expect(
        mockEscrowCompletionService.createEscrowCompletion,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockEscrowCompletionService.createEscrowCompletion,
      ).toHaveBeenCalledWith(
        incomingWebhookEntity.chainId,
        incomingWebhookEntity.escrowAddress,
      );

      incomingWebhookEntity.status = IncomingWebhookStatus.COMPLETED;
      expect(mockIncomingWebhookRepository.updateOne).toHaveBeenCalledTimes(1);
      expect(mockIncomingWebhookRepository.updateOne).toHaveBeenCalledWith(
        incomingWebhookEntity,
      );
    });

    it('should increase retries count in case of an error', async () => {
      const incomingWebhookEntity = generateIncomingWebhook();

      mockIncomingWebhookRepository.findByStatus.mockResolvedValueOnce([
        incomingWebhookEntity,
      ]);
      mockEscrowCompletionService.createEscrowCompletion.mockRejectedValueOnce(
        new Error(),
      );

      await incomingWebhookService.processPendingIncomingWebhooks();

      expect(mockIncomingWebhookRepository.updateOne).toHaveBeenCalledTimes(1);
      expect(mockIncomingWebhookRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: incomingWebhookEntity.id,
          status: incomingWebhookEntity.status,
          retriesCount: 1,
        }),
      );
    });

    it('should continue in case of a duplicated error', async () => {
      const incomingWebhookEntity = generateIncomingWebhook();

      mockIncomingWebhookRepository.findByStatus.mockResolvedValueOnce([
        incomingWebhookEntity,
      ]);
      mockEscrowCompletionService.createEscrowCompletion.mockRejectedValueOnce(
        new DatabaseError(DatabaseErrorMessages.DUPLICATED),
      );

      await incomingWebhookService.processPendingIncomingWebhooks();

      expect(mockIncomingWebhookRepository.updateOne).toHaveBeenCalledTimes(1);
      expect(mockIncomingWebhookRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: incomingWebhookEntity.id,
          status: IncomingWebhookStatus.COMPLETED,
        }),
      );
    });

    it('should set failed status if retries count exceeds the limit', async () => {
      const incomingWebhookEntity = generateIncomingWebhook({
        retriesCount: 1,
      });

      mockIncomingWebhookRepository.findByStatus.mockResolvedValueOnce([
        incomingWebhookEntity,
      ]);
      mockEscrowCompletionService.createEscrowCompletion.mockRejectedValueOnce(
        new Error(),
      );

      await incomingWebhookService.processPendingIncomingWebhooks();

      expect(mockIncomingWebhookRepository.updateOne).toHaveBeenCalledTimes(1);
      expect(mockIncomingWebhookRepository.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({
          id: incomingWebhookEntity.id,
          status: IncomingWebhookStatus.FAILED,
        }),
      );
    });
  });
});
