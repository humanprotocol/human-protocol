/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@nestjs/common';
import { ServerConfigService } from '../../common/config/server-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { BACKOFF_INTERVAL_SECONDS } from '../../common/constants';
import { EventType, WebhookIncomingStatus } from '../../common/enums';
import { calculateExponentialBackoffMs } from '../../utils/backoff';
import { isDuplicatedError } from '../../common/utils/database';
import { EscrowCompletionService } from '../escrow-completion/escrow-completion.service';
import { WebhookIncomingEntity } from './webhook-incoming.entity';
import { WebhookIncomingRepository } from './webhook-incoming.repository';
import { IncomingWebhookDto } from './webhook.dto';
import { IncomingWebhookError, WebhookErrorMessage } from './webhook.error';
import logger from '../../logger';

@Injectable()
export class WebhookIncomingService {
  private readonly logger = logger.child({
    context: WebhookIncomingService.name,
  });

  constructor(
    private readonly webhookIncomingRepository: WebhookIncomingRepository,
    private readonly escrowCompletionService: EscrowCompletionService,
    public readonly serverConfigService: ServerConfigService,
    public readonly web3ConfigService: Web3ConfigService,
  ) {}

  /**
   * Creates an incoming webhook entry in the repository.
   * Validates that the event type is 'JOB_COMPLETED' and sets initial status to 'PENDING'.
   * @param {IncomingWebhookDto} dto - Contains webhook details like chain ID and escrow address.
   * @throws {IncomingWebhookError} If the event type is invalid or the webhook cannot be created.
   */
  public async createIncomingWebhook(dto: IncomingWebhookDto): Promise<void> {
    if (dto.eventType !== EventType.JOB_COMPLETED) {
      throw new IncomingWebhookError(
        WebhookErrorMessage.INVALID_EVENT_TYPE,
        dto.chainId,
        dto.escrowAddress,
      );
    }

    let webhookEntity = new WebhookIncomingEntity();
    webhookEntity.chainId = dto.chainId;
    webhookEntity.escrowAddress = dto.escrowAddress;
    webhookEntity.status = WebhookIncomingStatus.PENDING;
    webhookEntity.waitUntil = new Date();
    webhookEntity.retriesCount = 0;

    webhookEntity =
      await this.webhookIncomingRepository.createUnique(webhookEntity);
  }

  /**
   * Handles errors that occur while processing an incoming webhook.
   * If retry count is below the maximum, increments retry count and reschedules; otherwise, marks as 'FAILED'.
   * @param webhookEntity - The incoming webhook entity.
   * @param failureDetail - Reason for the failure.
   */
  private async handleWebhookIncomingError(
    webhookEntity: WebhookIncomingEntity,
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
      webhookEntity.status = WebhookIncomingStatus.FAILED;
    }
    await this.webhookIncomingRepository.updateOne(webhookEntity);
  }

  public async processPendingIncomingWebhooks(): Promise<void> {
    const webhookEntities = await this.webhookIncomingRepository.findByStatus(
      WebhookIncomingStatus.PENDING,
    );

    for (const webhookEntity of webhookEntities) {
      try {
        const { chainId, escrowAddress } = webhookEntity;

        await this.escrowCompletionService.createEscrowCompletion(
          chainId,
          escrowAddress,
        );

        webhookEntity.status = WebhookIncomingStatus.COMPLETED;
        await this.webhookIncomingRepository.updateOne(webhookEntity);
      } catch (error) {
        if (isDuplicatedError(error)) {
          webhookEntity.status = WebhookIncomingStatus.COMPLETED;
          await this.webhookIncomingRepository.updateOne(webhookEntity);
        } else {
          // Handle other errors (general failure)
          this.logger.error('Error processing incoming webhook', {
            error,
            webhookId: webhookEntity.id,
          });

          await this.handleWebhookIncomingError(
            webhookEntity,
            `Error message: ${error.message}`,
          );
        }
        continue;
      }
    }
  }
}
