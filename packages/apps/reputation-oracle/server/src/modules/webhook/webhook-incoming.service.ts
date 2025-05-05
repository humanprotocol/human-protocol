import { Injectable } from '@nestjs/common';

import { BACKOFF_INTERVAL_SECONDS } from '../../common/constants';
import { isDuplicatedError } from '../../database';
import { ServerConfigService } from '../../config';
import { EscrowCompletionService } from '../escrow-completion';
import { calculateExponentialBackoffMs } from '../../utils/backoff';
import logger from '../../logger';

import { IncomingWebhookData, IncomingWebhookStatus } from './types';
import { IncomingWebhookEntity } from './webhook-incoming.entity';
import { IncomingWebhookRepository } from './webhook-incoming.repository';

@Injectable()
export class IncomingWebhookService {
  private readonly logger = logger.child({
    context: IncomingWebhookService.name,
  });

  constructor(
    private readonly escrowCompletionService: EscrowCompletionService,
    private readonly incomingWebhookRepository: IncomingWebhookRepository,
    private readonly serverConfigService: ServerConfigService,
  ) {}

  async createIncomingWebhook(data: IncomingWebhookData): Promise<void> {
    const webhookEntity = new IncomingWebhookEntity();
    webhookEntity.chainId = data.chainId;
    webhookEntity.escrowAddress = data.escrowAddress;
    webhookEntity.status = IncomingWebhookStatus.PENDING;
    webhookEntity.waitUntil = new Date();
    webhookEntity.retriesCount = 0;

    await this.incomingWebhookRepository.createUnique(webhookEntity);
  }

  private async handleIncomingWebhookProcessingError(
    webhookEntity: IncomingWebhookEntity,
    failureDetail: string,
  ): Promise<void> {
    if (webhookEntity.retriesCount < this.serverConfigService.maxRetryCount) {
      const exponentialBackoff = calculateExponentialBackoffMs(
        webhookEntity.retriesCount,
        BACKOFF_INTERVAL_SECONDS,
      );
      webhookEntity.waitUntil = new Date(Date.now() + exponentialBackoff);
      webhookEntity.retriesCount += 1;
    } else {
      webhookEntity.failureDetail = failureDetail;
      webhookEntity.status = IncomingWebhookStatus.FAILED;
    }
    await this.incomingWebhookRepository.updateOne(webhookEntity);
  }

  async processPendingIncomingWebhooks(): Promise<void> {
    const webhookEntities = await this.incomingWebhookRepository.findByStatus(
      IncomingWebhookStatus.PENDING,
    );

    for (const webhookEntity of webhookEntities) {
      try {
        const { chainId, escrowAddress } = webhookEntity;

        await this.escrowCompletionService.createEscrowCompletion(
          chainId,
          escrowAddress,
        );

        webhookEntity.status = IncomingWebhookStatus.COMPLETED;
        await this.incomingWebhookRepository.updateOne(webhookEntity);
      } catch (error) {
        if (isDuplicatedError(error)) {
          webhookEntity.status = IncomingWebhookStatus.COMPLETED;
          await this.incomingWebhookRepository.updateOne(webhookEntity);
        } else {
          this.logger.error('Error processing incoming webhook', {
            error,
            webhookId: webhookEntity.id,
          });

          await this.handleIncomingWebhookProcessingError(
            webhookEntity,
            `Error message: ${error.message}`,
          );
        }
        continue;
      }
    }
  }
}
