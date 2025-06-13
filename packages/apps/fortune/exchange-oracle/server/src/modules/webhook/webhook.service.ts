/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ChainId, EscrowClient, OperatorUtils } from '@human-protocol/sdk';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ServerConfigService } from '../../common/config/server-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { HEADER_SIGNATURE_KEY } from '../../common/constant';
import { ErrorWebhook } from '../../common/constant/errors';
import { EventType, WebhookStatus } from '../../common/enums/webhook';
import { ValidationError } from '../../common/errors';
import { CaseConverter } from '../../common/utils/case-converter';
import { formatAxiosError } from '../../common/utils/http';
import { signMessage } from '../../common/utils/signature';
import { JobService } from '../job/job.service';
import { StorageService } from '../storage/storage.service';
import { Web3Service } from '../web3/web3.service';
import { WebhookDto } from './webhook.dto';
import { WebhookEntity } from './webhook.entity';
import { WebhookRepository } from './webhook.repository';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly webhookRepository: WebhookRepository,
    private readonly jobService: JobService,
    public readonly web3ConfigService: Web3ConfigService,
    public readonly serverConfigService: ServerConfigService,
    public readonly httpService: HttpService,
    public readonly web3Service: Web3Service,
    public readonly storageService: StorageService,
  ) {}

  public async handleWebhook(webhook: WebhookDto): Promise<void> {
    switch (webhook.eventType) {
      case EventType.ESCROW_CREATED:
        await this.jobService.createJob(webhook);
        break;

      case EventType.ESCROW_COMPLETED:
        await this.jobService.completeJob(webhook);
        break;

      case EventType.CANCELLATION_REQUESTED:
        await this.jobService.cancelJob(webhook);
        break;

      case EventType.SUBMISSION_REJECTED:
        await this.jobService.processInvalidJobSolution(webhook);
        break;

      case EventType.ABUSE_DETECTED:
        await this.jobService.pauseJob(webhook);
        break;

      case EventType.ABUSE_DISMISSED:
        await this.jobService.resumeJob(webhook);
        break;

      case EventType.ESCROW_CANCELED:
        return;

      default:
        throw new ValidationError(
          `Invalid webhook event type: ${webhook.eventType}`,
        );
    }
  }

  /**
   * Send a webhook with the provided data.
   * @param webhook - Webhook entity containing data for the webhook.
   * @returns {Promise<void>} - Returns a promise that resolves when the operation is complete.
   * @throws {Error} - Throws an error if an issue occurs during the process.
   */
  public async sendWebhook(webhook: WebhookEntity): Promise<void> {
    // Configure the HTTP request object.
    let config = {};
    const webhookUrl = await this.getOracleWebhookUrl(
      webhook.escrowAddress,
      webhook.chainId,
      webhook.eventType,
    );

    // Check if the webhook URL was found.
    if (!webhookUrl) {
      throw new Error(ErrorWebhook.UrlNotFound);
    }

    // Build the webhook data object based on the oracle type.
    const webhookData: WebhookDto = {
      escrowAddress: webhook.escrowAddress,
      chainId: webhook.chainId,
      eventType: webhook.eventType,
    };
    if (webhook.eventType === EventType.SUBMISSION_IN_REVIEW) {
      webhookData.eventData = {
        solutionsUrl: this.storageService.getJobUrl(
          webhook.escrowAddress,
          webhook.chainId,
        ),
      };
    }
    if (webhook.eventType === EventType.ESCROW_FAILED) {
      webhookData.eventData = {
        reason: webhook.failureDetail,
      };
    }
    const transformedWebhook = CaseConverter.transformToSnakeCase(webhookData);

    const signedBody = await signMessage(
      transformedWebhook,
      this.web3ConfigService.privateKey,
    );

    config = {
      headers: { [HEADER_SIGNATURE_KEY]: signedBody },
    };

    // Make the HTTP request to the webhook.
    try {
      await firstValueFrom(
        this.httpService.post(webhookUrl, transformedWebhook, config),
      );
    } catch (error) {
      const formattedError = formatAxiosError(error);
      this.logger.error('Webhook not sent', {
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
    if (webhookEntity.retriesCount >= this.serverConfigService.maxRetryCount) {
      webhookEntity.status = WebhookStatus.FAILED;
    } else {
      webhookEntity.waitUntil = new Date();
      webhookEntity.retriesCount = webhookEntity.retriesCount + 1;
    }
    this.webhookRepository.updateOne(webhookEntity);
  }

  /**
   * Get the webhook URL from the oracle.
   * @param escrowAddress - Escrow contract address.
   * @param chainId - Chain ID.
   * @param eventType - Webhook event type.
   * @returns {Promise<string>} - Returns the webhook URL.
   */
  private async getOracleWebhookUrl(
    escrowAddress: string,
    chainId: ChainId,
    eventType: EventType,
  ): Promise<string | undefined> {
    // Get the signer for the given chain.
    const signer = this.web3Service.getSigner(chainId);
    const escrowClient = await EscrowClient.build(signer);
    let oracleAddress: string;
    switch (eventType) {
      case EventType.ESCROW_FAILED:
        oracleAddress = await escrowClient.getJobLauncherAddress(escrowAddress);
        break;
      case EventType.SUBMISSION_IN_REVIEW:
        oracleAddress =
          await escrowClient.getRecordingOracleAddress(escrowAddress);
        break;
      default:
        throw new ValidationError('Invalid outgoing event type');
    }
    const oracle = await OperatorUtils.getOperator(chainId, oracleAddress);
    const oracleWebhookUrl = oracle.webhookUrl;

    return oracleWebhookUrl;
  }
}
