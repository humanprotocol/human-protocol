/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ChainId,
  EscrowClient,
  KVStoreClient,
  KVStoreKeys,
} from '@human-protocol/sdk';
import { LessThanOrEqual } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ConfigNames } from '../../common/config';
import { signMessage } from '../../common/utils/signature';
import { WebhookRepository } from './webhook.repository';
import { firstValueFrom } from 'rxjs';
import {
  DEFAULT_MAX_RETRY_COUNT,
  HEADER_SIGNATURE_KEY,
} from '../../common/constants';
import { HttpService } from '@nestjs/axios';
import { Web3Service } from '../web3/web3.service';
import { WebhookStatus } from '../../common/enums/webhook';
import { ErrorWebhook } from '../../common/constants/errors';
import { WebhookEntity } from './webhook.entity';
import { WebhookDataDto, WebhookDto } from './webhook.dto';
import { CaseConverter } from '../../common/utils/case-converter';
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @Inject(Web3Service)
    private readonly web3Service: Web3Service,
    private readonly webhookRepository: WebhookRepository,
    public readonly configService: ConfigService,
    public readonly httpService: HttpService,
  ) {}

  /**
   * Create a webhook using the DTO data.
   * @param dto - Data to create an incoming webhook.
   * @returns {Promise<void>} - Returns a promise that resolves when the operation is complete.
   * @throws {Error} - Throws an error if an issue occurs during the process.
   */
  public async createWebhook(dto: WebhookDto): Promise<void> {
    try {
      // Create a webhook entity with the provided data.
      const webhookEntity = await this.webhookRepository.create({
        chainId: dto.chainId,
        escrowAddress: dto.escrowAddress,
        eventType: dto.eventType,
        oracleType: dto.oracleType,
        hasSignature: dto.hasSignature,
        status: WebhookStatus.PENDING,
        waitUntil: new Date(),
        retriesCount: 0,
      });

      // Check if the webhook entity was created successfully.
      if (!webhookEntity) {
        this.logger.log(ErrorWebhook.NotCreated, WebhookService.name);
        throw new NotFoundException(ErrorWebhook.NotCreated);
      }
    } catch (e) {
      throw new Error(e);
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
    const webhookUrl = await this.getExchangeOracleWebhookUrl(
      webhook.escrowAddress,
      webhook.chainId,
    );

    // Check if the webhook URL was found.
    if (!webhookUrl) {
      this.logger.log(ErrorWebhook.UrlNotFound, WebhookService.name);
      throw new NotFoundException(ErrorWebhook.UrlNotFound);
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
        this.configService.get(ConfigNames.WEB3_PRIVATE_KEY)!,
      );

      config = {
        headers: { [HEADER_SIGNATURE_KEY]: signedBody },
      };
    }

    // Make the HTTP request to the webhook.
    const { data } = await firstValueFrom(
      await this.httpService.post(webhookUrl, webhookData, config),
    );

    // Check if the request was successful.
    if (!data) {
      this.logger.log(ErrorWebhook.NotSent, WebhookService.name);
      throw new NotFoundException(ErrorWebhook.NotSent);
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
  public async handleWebhookError(
    webhookEntity: WebhookEntity,
    error: any,
  ): Promise<void> {
    if (
      webhookEntity.retriesCount >=
      this.configService.get(
        ConfigNames.MAX_RETRY_COUNT,
        DEFAULT_MAX_RETRY_COUNT,
      )
    ) {
      await this.webhookRepository.updateOne(
        { id: webhookEntity.id },
        { status: WebhookStatus.FAILED },
      );
    } else {
      await this.webhookRepository.updateOne(
        { id: webhookEntity.id },
        {
          retriesCount: webhookEntity.retriesCount + 1,
          waitUntil: new Date(),
        },
      );
    }

    this.logger.error(
      'An error occurred during webhook validation: ',
      error,
      WebhookService.name,
    );
  }
  /**
   * Finds webhooks based on the provided status and additional criteria.
   * @param status - WebhookStatus enum representing the status to filter by.
   * @returns {Promise<WebhookEntity[]>} - Returns a promise that resolves with an array of WebhookEntity objects.
   * @throws {Error} - Throws an error if an issue occurs during the retrieval process.
   */
  public async findWebhookByStatus(
    status: WebhookStatus,
  ): Promise<WebhookEntity[]> {
    return this.webhookRepository.find({
      status: status,
      retriesCount: LessThanOrEqual(
        this.configService.get(
          ConfigNames.MAX_RETRY_COUNT,
          DEFAULT_MAX_RETRY_COUNT,
        ),
      ),
      waitUntil: LessThanOrEqual(new Date()),
    });
  }

  /**
   * Updates the status of a webhook identified by its ID.
   * @param id - The ID of the webhook to update.
   * @param status - WebhookStatus enum representing the new status.
   * @returns {Promise<void>} - Returns a promise that resolves when the update operation is complete.
   * @throws {Error} - Throws an error if an issue occurs during the update process.
   */
  public async updateWebhookStatus(
    id: number,
    status: WebhookStatus,
  ): Promise<void> {
    await this.webhookRepository.updateOne(
      { id: id },
      {
        status: status,
      },
    );
  }
}
