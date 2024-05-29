/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  ChainId,
  EscrowClient,
  KVStoreClient,
  KVStoreKeys,
} from '@human-protocol/sdk';
import { ServerConfigService } from '../../common/config/server-config.service';
import { Web3ConfigService } from '../../common/config/web3-config.service';
import { signMessage } from '../../common/utils/signature';
import { WebhookRepository } from './webhook.repository';
import { firstValueFrom } from 'rxjs';
import { HEADER_SIGNATURE_KEY } from '../../common/constants';
import { HttpService } from '@nestjs/axios';
import { Web3Service } from '../web3/web3.service';
import { WebhookStatus } from '../../common/enums/webhook';
import { ErrorWebhook } from '../../common/constants/errors';
import { WebhookEntity } from './webhook.entity';
import { WebhookDataDto } from './webhook.dto';
import { CaseConverter } from '../../common/utils/case-converter';
import { EventType } from '../../common/enums/webhook';
import { JobService } from '../job/job.service';
import { ControlledError } from '../../common/errors/controlled';
@Injectable()
export class WebhookService {
  constructor(
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    private readonly webhookRepository: WebhookRepository,
    private readonly jobService: JobService,
    public readonly commonConfigSerice: ServerConfigService,
    public readonly web3ConfigService: Web3ConfigService,
    public readonly httpService: HttpService,
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
    const webhookUrl = await this.getExchangeOracleWebhookUrl(
      webhook.escrowAddress,
      webhook.chainId,
    );

    // Check if the webhook URL was found.
    if (!webhookUrl) {
      throw new ControlledError(ErrorWebhook.UrlNotFound, HttpStatus.NOT_FOUND);
    }

    // Build the webhook data object based on the oracle type.
    const webhookData = CaseConverter.transformToSnakeCase({
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
    const { status } = await firstValueFrom(
      this.httpService.post(webhookUrl, webhookData, config),
    );

    // Check if the request was successful.
    if (status !== HttpStatus.CREATED && status !== HttpStatus.OK) {
      throw new ControlledError(ErrorWebhook.NotSent, HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Get the webhook URL from the exchange oracle.
   * @param escrowAddress - Escrow contract address.
   * @param chainId - Chain ID.
   * @returns {Promise<string>} - Returns the webhook URL.
   */
  private async getExchangeOracleWebhookUrl(
    escrowAddress: string,
    chainId: ChainId,
  ): Promise<string> {
    // Get the signer for the given chain.
    const signer = this.web3Service.getSigner(chainId);

    // Build the escrow client and get the exchange oracle address.
    const escrowClient = await EscrowClient.build(signer);
    const exchangeAddress =
      await escrowClient.getExchangeOracleAddress(escrowAddress);

    // Build the KVStore client and get the webhook URL.
    const kvStoreClient = await KVStoreClient.build(signer);
    const exchangeOracleUrl = await kvStoreClient.get(
      exchangeAddress,
      KVStoreKeys.webhookUrl,
    );

    return exchangeOracleUrl;
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
        await this.jobService.completeJob(webhook);
        break;

      case EventType.TASK_CREATION_FAILED:
        await this.jobService.escrowFailedWebhook(webhook);
        break;

      case EventType.ESCROW_FAILED:
        await this.jobService.escrowFailedWebhook(webhook);
        break;

      default:
        throw new ControlledError(
          `Invalid webhook event type: ${webhook.eventType}`,
          HttpStatus.BAD_REQUEST,
        );
    }
  }
}
