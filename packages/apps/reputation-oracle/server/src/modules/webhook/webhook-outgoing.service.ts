/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as crypto from 'crypto';
import stringify from 'json-stable-stringify';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { WebhookOutgoingStatus } from '../../common/enums';
import { firstValueFrom } from 'rxjs';
import { signMessage } from '../../common/utils/signature';
import {
  BACKOFF_INTERVAL_SECONDS,
  HEADER_SIGNATURE_KEY,
} from '../../common/constants';
import { HttpService } from '@nestjs/axios';
import { CaseConverter } from '../../common/utils/case-converter';
import { ServerConfigService } from '../../common/config/server-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { WebhookOutgoingEntity } from './webhook-outgoing.entity';
import { WebhookOutgoingRepository } from './webhook-outgoing.repository';
import { calculateExponentialBackoffMs } from '../../common/utils/backoff';
import { OutgoingWebhookError, WebhookErrorMessage } from './webhook.error';

@Injectable()
export class WebhookOutgoingService {
  private readonly logger = new Logger(WebhookOutgoingService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly webhookOutgoingRepository: WebhookOutgoingRepository,
    public readonly serverConfigService: ServerConfigService,
    public readonly web3ConfigService: Web3ConfigService,
  ) {}

  /**
   * Creates an outgoing webhook entry in the repository.
   * Sets initial status to 'PENDING' and stores the provided payload, hash, and URL.
   * @param {object} payload - The payload to send in the webhook.
   * @param {string} hash - A hash generated from the URL and payload for unique identification.
   * @param {string} url - The destination URL for the outgoing webhook.
   */
  public async createOutgoingWebhook(
    payload: Record<string, unknown>,
    url: string,
  ): Promise<void> {
    const hash = crypto
      .createHash('sha1')
      .update(stringify({ payload, url }))
      .digest('hex');

    let webhookEntity = new WebhookOutgoingEntity();
    webhookEntity.payload = payload;
    webhookEntity.hash = hash;
    webhookEntity.url = url;
    webhookEntity.status = WebhookOutgoingStatus.PENDING;
    webhookEntity.waitUntil = new Date();
    webhookEntity.retriesCount = 0;

    webhookEntity =
      await this.webhookOutgoingRepository.createUnique(webhookEntity);
  }

  /**
   * Handles errors that occur while processing an outgoing webhook.
   * If retry count is below the maximum, increments retry count and reschedules; otherwise, marks as 'FAILED'.
   * @param webhookEntity - The outgoing webhook entity.
   * @param failureDetail - Reason for the failure.
   */
  private async handleWebhookOutgoingError(
    webhookEntity: WebhookOutgoingEntity,
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
      webhookEntity.status = WebhookOutgoingStatus.FAILED;
    }
    await this.webhookOutgoingRepository.updateOne(webhookEntity);
  }

  /**
   * Sends a webhook request with a signed payload.
   * Converts payload to snake_case, signs it, and sends it to the specified URL.
   * @param {string} url - The target URL to which the webhook is sent.
   * @param {object} payload - The data payload to send.
   * @throws {OutgoingWebhookError} If the webhook request fails.
   */
  public async sendWebhook(
    outgoingWebhook: WebhookOutgoingEntity,
  ): Promise<void> {
    const snake_case_body = CaseConverter.transformToSnakeCase(
      outgoingWebhook.payload,
    );
    const signedBody = await signMessage(
      snake_case_body,
      this.web3ConfigService.privateKey,
    );
    const { status } = await firstValueFrom(
      await this.httpService.post(outgoingWebhook.url, snake_case_body, {
        headers: { [HEADER_SIGNATURE_KEY]: signedBody },
      }),
    );

    if (status !== HttpStatus.CREATED) {
      throw new OutgoingWebhookError(
        WebhookErrorMessage.NOT_SENT,
        outgoingWebhook.hash,
      );
    }
  }

  public async processPendingOutgoingWebhooks(): Promise<void> {
    const webhookEntities = await this.webhookOutgoingRepository.findByStatus(
      WebhookOutgoingStatus.PENDING,
    );

    for (const webhookEntity of webhookEntities) {
      try {
        await this.sendWebhook(webhookEntity);
      } catch (err) {
        const failureDetail = `Error message: ${err.message}`;
        this.logger.error(
          `Error processing outgoing webhook. Webhook ID: ${webhookEntity.id}. ${failureDetail}`,
        );
        await this.handleWebhookOutgoingError(webhookEntity, failureDetail);
        continue;
      }
      webhookEntity.status = WebhookOutgoingStatus.SENT;
      await this.webhookOutgoingRepository.updateOne(webhookEntity);
    }
  }
}
