/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { v4 as uuidv4 } from 'uuid';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { IncomingWebhookDto } from './webhook.dto';
import { ErrorWebhook } from '../../common/constants/errors';
import { EventType, WebhookIncomingStatus } from '../../common/enums';
import { BACKOFF_INTERVAL_SECONDS } from '../../common/constants';
import { ServerConfigService } from '../../common/config/server-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ControlledError } from '../../common/errors/controlled';
import { WebhookIncomingEntity } from './webhook-incoming.entity';
import { WebhookIncomingRepository } from './webhook-incoming.repository';
import { calculateExponentialBackoffMs } from '../../common/utils/backoff';
import { EscrowCompletionTrackingService } from '../escrow-completion-tracking/escrow-completion-tracking.service';
import { isDuplicatedError } from '../../common/utils/database';

@Injectable()
export class WebhookIncomingService {
  private readonly logger = new Logger(WebhookIncomingService.name);

  constructor(
    private readonly webhookIncomingRepository: WebhookIncomingRepository,
    private readonly escrowCompletionTrackingService: EscrowCompletionTrackingService,
    public readonly serverConfigService: ServerConfigService,
    public readonly web3ConfigService: Web3ConfigService,
  ) {}

  /**
   * Creates an incoming webhook entry in the repository.
   * Validates that the event type is 'JOB_COMPLETED' and sets initial status to 'PENDING'.
   * @param {IncomingWebhookDto} dto - Contains webhook details like chain ID and escrow address.
   * @throws {ControlledError} If the event type is invalid or the webhook cannot be created.
   */
  public async createIncomingWebhook(dto: IncomingWebhookDto): Promise<void> {
    if (dto.eventType !== EventType.JOB_COMPLETED) {
      throw new ControlledError(
        ErrorWebhook.InvalidEventType,
        HttpStatus.BAD_REQUEST,
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

    if (!webhookEntity) {
      throw new ControlledError(ErrorWebhook.NotCreated, HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Handles errors that occur while processing an incoming webhook.
   * If retry count is below the maximum, increments retry count and reschedules; otherwise, marks as 'FAILED'.
   * @param webhookEntity - The incoming webhook entity.
   * @param failureDetail - Reason for the failure.
   */
  public async handleWebhookIncomingError(
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

        await this.escrowCompletionTrackingService.createEscrowCompletionTracking(
          chainId,
          escrowAddress,
        );

        webhookEntity.status = WebhookIncomingStatus.COMPLETED;
        await this.webhookIncomingRepository.updateOne(webhookEntity);
      } catch (err) {
        const errorId = uuidv4();
        const failureDetail = `${ErrorWebhook.PendingProcessingFailed} (Error ID: ${errorId})`;

        if (isDuplicatedError(err)) {
          // Handle duplicated error: log and mark as completed
          this.logger.warn(
            `Duplicate tracking entity for escrowAddress: ${webhookEntity.escrowAddress}. Marking webhook as completed.`,
          );
          webhookEntity.status = WebhookIncomingStatus.COMPLETED;
          await this.webhookIncomingRepository.updateOne(webhookEntity);
        } else {
          // Handle other errors (general failure)
          this.logger.error(
            `Error processing webhook. Error ID: ${errorId}, Webhook ID: ${webhookEntity.id}, Reason: ${failureDetail}, Message: ${err.message}`,
          );
          await this.handleWebhookIncomingError(webhookEntity, failureDetail);
        }
        continue;
      }
    }
  }
}
