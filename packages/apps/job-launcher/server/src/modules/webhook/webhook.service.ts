import { KVStoreKeys, KVStoreUtils } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ServerConfigService } from '../../common/config/server-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';
import { ErrorWebhook } from '../../common/constants/errors';
import { EventType, WebhookStatus } from '../../common/enums/webhook';
import { ServerError, ValidationError } from '../../common/errors';
import { transformKeysFromCamelToSnake } from '../../common/utils/case-converter';
import { formatAxiosError } from '../../common/utils/http';
import { signMessage } from '../../common/utils/signature';
import logger from '../../logger';
import { JobRepository } from '../job/job.repository';
import { JobService } from '../job/job.service';
import { WebhookDataDto } from './webhook.dto';
import { WebhookEntity } from './webhook.entity';
import { WebhookRepository } from './webhook.repository';

@Injectable()
export class WebhookService {
  private readonly logger = logger.child({ context: WebhookService.name });

  constructor(
    private readonly webhookRepository: WebhookRepository,
    private readonly jobService: JobService,
    private readonly jobRepository: JobRepository,
    private readonly commonConfigSerice: ServerConfigService,
    private readonly web3ConfigService: Web3ConfigService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Send a webhook with the provided data.
   * @param webhook - Webhook entity containing data for the webhook.
   * @returns {Promise<void>} - Returns a promise that resolves when the operation is complete.
   * @throws {Error} - Throws an error if an issue occurs during the process.
   */
  public async sendWebhook(webhook: WebhookEntity): Promise<void> {
    // Configure the HTTP request object.
    let config = {};

    if (!webhook.oracleAddress) {
      throw new ServerError(ErrorWebhook.InvalidOracleAddress);
    }
    const webhookUrl = await KVStoreUtils.get(
      webhook.chainId,
      webhook.oracleAddress,
      KVStoreKeys.webhookUrl,
    );

    // Check if the webhook URL was found.
    if (!webhookUrl) {
      throw new ServerError(ErrorWebhook.UrlNotFound);
    }

    // Build the webhook data object based on the oracle type.
    const webhookData: any = transformKeysFromCamelToSnake({
      escrowAddress: webhook.escrowAddress,
      chainId: webhook.chainId,
      eventType: webhook.eventType,
    } as WebhookDataDto);

    // Add the signature to the request body if necessary.
    if (webhook.hasSignature) {
      const signedBody = await signMessage(
        webhookData,
        this.web3ConfigService.privateKey,
      );

      config = {
        headers: { [HEADER_SIGNATURE_KEY]: signedBody },
      };
    }

    // Make the HTTP request to the webhook.
    try {
      await firstValueFrom(
        this.httpService.post(webhookUrl, webhookData, config),
      );
    } catch (error) {
      const formattedError = formatAxiosError(error);
      this.logger.error('Webhook not sent', {
        webhookId: webhook.id,
        error: formattedError,
      });
      throw new Error(formattedError.message);
    }
  }

  /**
   * Handles errors that occur during webhook processing.
   * It logs the error and, based on retry count, updates the webhook status accordingly.
   * @param webhookEntity - The entity representing the webhook data.
   * @param error - The error object thrown during processing.
   * @returns {Promise<void>} - Returns a promise that resolves when the operation is complete.
   */
  public async handleWebhookError(webhookEntity: WebhookEntity): Promise<void> {
    if (webhookEntity.retriesCount >= this.commonConfigSerice.maxRetryCount) {
      webhookEntity.status = WebhookStatus.FAILED;
    } else {
      webhookEntity.waitUntil = new Date();
      webhookEntity.retriesCount = webhookEntity.retriesCount + 1;
    }
    this.webhookRepository.updateOne(webhookEntity);
  }

  public async handleWebhook(webhook: WebhookDataDto): Promise<void> {
    switch (webhook.eventType) {
      case EventType.ESCROW_COMPLETED:
      case EventType.ESCROW_CANCELED:
        await this.jobService.finalizeJob(webhook);
        break;

      case EventType.ESCROW_FAILED:
        await this.jobService.escrowFailedWebhook(webhook);
        break;

      case EventType.ABUSE_DETECTED:
        await this.createIncomingWebhook(webhook);
        break;

      default:
        throw new ValidationError(
          `Invalid webhook event type: ${webhook.eventType}`,
        );
    }
  }

  private async createIncomingWebhook(webhook: WebhookDataDto): Promise<void> {
    const jobEntity = await this.jobRepository.findOneByChainIdAndEscrowAddress(
      webhook.chainId,
      webhook.escrowAddress,
    );

    if (!jobEntity) {
      throw new Error(ErrorWebhook.InvalidEscrow);
    }

    const webhookEntity = new WebhookEntity();
    Object.assign(webhookEntity, webhook);
    webhookEntity.oracleType = this.jobService.getOracleType(
      jobEntity.requestType,
    );
    webhookEntity.hasSignature = false;

    this.webhookRepository.createUnique(webhookEntity);
  }
}
