/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateWebhookIncomingDto } from './webhook.dto';
import { ErrorWebhook } from '../../common/constants/errors';
import {
  EscrowCompletionTrackingStatus,
  EventType,
  WebhookIncomingStatus,
  WebhookOutgoingStatus,
} from '../../common/enums';
import { firstValueFrom } from 'rxjs';
import { signMessage } from '../../common/utils/signature';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';
import { HttpService } from '@nestjs/axios';
import { CaseConverter } from '../../common/utils/case-converter';
import { ServerConfigService } from '../../common/config/server-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { ControlledError } from '../../common/errors/controlled';
import { WebhookIncomingEntity } from './webhook-incoming.entity';
import { WebhookOutgoingEntity } from './webhook-outgoing.entity';
import { WebhookIncomingRepository } from './webhook-incoming.repository';
import { WebhookOutgoingRepository } from './webhook-outgoing.repository';

@Injectable()
export class WebhookService {
  constructor(
    private readonly httpService: HttpService,
    private readonly webhookIncomingRepository: WebhookIncomingRepository,
    private readonly webhookOutgoingRepository: WebhookOutgoingRepository,
    public readonly serverConfigService: ServerConfigService,
    public readonly web3ConfigService: Web3ConfigService,
  ) {}

  /**
   * Creates an incoming webhook entry in the repository.
   * Validates that the event type is 'JOB_COMPLETED' and sets initial status to 'PENDING'.
   * @param {CreateWebhookIncomingDto} dto - Contains webhook details like chain ID and escrow address.
   * @throws {ControlledError} If the event type is invalid or the webhook cannot be created.
   */
  public async createIncomingWebhook(
    dto: CreateWebhookIncomingDto,
  ): Promise<void> {
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
   * Creates an outgoing webhook entry in the repository.
   * Sets initial status to 'PENDING' and stores the provided payload, hash, and URL.
   * @param {object} payload - The payload to send in the webhook.
   * @param {string} hash - A hash generated from the URL and payload for unique identification.
   * @param {string} url - The destination URL for the outgoing webhook.
   * @throws {ControlledError} If the webhook cannot be created.
   */
  public async createOutgoingWebhook(
    payload: object,
    hash: string,
    url: string,
  ): Promise<void> {
    let webhookEntity = new WebhookOutgoingEntity();
    webhookEntity.payload = payload;
    webhookEntity.hash = hash;
    webhookEntity.url = url;
    webhookEntity.status = WebhookOutgoingStatus.PENDING;
    webhookEntity.waitUntil = new Date();
    webhookEntity.retriesCount = 0;

    webhookEntity =
      await this.webhookOutgoingRepository.createUnique(webhookEntity);

    if (!webhookEntity) {
      throw new ControlledError(ErrorWebhook.NotCreated, HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Handles errors that occur while processing an incoming webhook.
   * If retry count is below the maximum, increments retry count and reschedules; otherwise, marks as 'FAILED'.
   * @param webhookEntity - The incoming webhook entity.
   * @param failedReason - Reason for the failure.
   */
  public async handleWebhookIncomingError(
    webhookEntity: WebhookIncomingEntity,
    failedReason: string,
  ): Promise<void> {
    if (webhookEntity.retriesCount < this.serverConfigService.maxRetryCount) {
      webhookEntity.waitUntil = new Date();
      webhookEntity.retriesCount += 1;
    } else {
      webhookEntity.failedReason = failedReason;
      webhookEntity.status = WebhookIncomingStatus.FAILED;
    }
    this.webhookIncomingRepository.updateOne(webhookEntity);
  }

  /**
   * Handles errors that occur while processing an outgoing webhook.
   * If retry count is below the maximum, increments retry count and reschedules; otherwise, marks as 'FAILED'.
   * @param webhookEntity - The outgoing webhook entity.
   * @param failedReason - Reason for the failure.
   */
  public async handleWebhookOutgoingError(
    webhookEntity: WebhookOutgoingEntity,
    failedReason: string,
  ): Promise<void> {
    if (webhookEntity.retriesCount < this.serverConfigService.maxRetryCount) {
      webhookEntity.waitUntil = new Date();
      webhookEntity.retriesCount += 1;
    } else {
      webhookEntity.failedReason = failedReason;
      webhookEntity.status = WebhookOutgoingStatus.FAILED;
    }
    this.webhookOutgoingRepository.updateOne(webhookEntity);
  }

  /**
   * Sends a webhook request with a signed payload.
   * Converts payload to snake_case, signs it, and sends it to the specified URL.
   * @param {string} url - The target URL to which the webhook is sent.
   * @param {object} payload - The data payload to send.
   * @throws {ControlledError} If the webhook request fails.
   */
  public async sendWebhook(url: string, payload: object): Promise<void> {
    const snake_case_body = CaseConverter.transformToSnakeCase(payload);
    const signedBody = await signMessage(
      snake_case_body,
      this.web3ConfigService.privateKey,
    );
    const { status } = await firstValueFrom(
      await this.httpService.post(url, snake_case_body, {
        headers: { [HEADER_SIGNATURE_KEY]: signedBody },
      }),
    );

    if (status !== HttpStatus.CREATED) {
      throw new ControlledError(ErrorWebhook.NotSent, HttpStatus.NOT_FOUND);
    }
  }
}
