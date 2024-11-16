/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import stringify from 'json-stable-stringify';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { IncomingWebhookDto } from './webhook.dto';
import { ErrorWebhook } from '../../common/constants/errors';
import {
  EscrowCompletionTrackingStatus,
  EventType,
  WebhookIncomingStatus,
  WebhookOutgoingStatus,
} from '../../common/enums';
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
import { ControlledError } from '../../common/errors/controlled';
import { WebhookIncomingEntity } from './webhook-incoming.entity';
import { WebhookOutgoingEntity } from './webhook-outgoing.entity';
import { WebhookIncomingRepository } from './webhook-incoming.repository';
import { WebhookOutgoingRepository } from './webhook-outgoing.repository';
import { calculateBackoff } from '../../common/utils/cron';
import { EscrowCompletionTrackingService } from '../escrow-completion-tracking/escrow-completion-tracking.service';
import { DatabaseError } from '../../common/errors/database';
import { PostgresErrorCodes } from '../../common/enums/database';
import { EscrowCompletionTrackingRepository } from '../escrow-completion-tracking/escrow-completion-tracking.repository';
import { Web3Service } from '../web3/web3.service';
import { EscrowClient, EscrowStatus, OperatorUtils } from '@human-protocol/sdk';
import { PayoutService } from '../payout/payout.service';
import { ReputationService } from '../reputation/reputation.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly web3Service: Web3Service,
    private readonly webhookIncomingRepository: WebhookIncomingRepository,
    private readonly webhookOutgoingRepository: WebhookOutgoingRepository,
    private readonly escrowCompletionTrackingRepository: EscrowCompletionTrackingRepository,
    private readonly escrowCompletionTrackingService: EscrowCompletionTrackingService,
    private readonly payoutService: PayoutService,
    private readonly reputationService: ReputationService,
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
   * Creates an outgoing webhook entry in the repository.
   * Sets initial status to 'PENDING' and stores the provided payload, hash, and URL.
   * @param {object} payload - The payload to send in the webhook.
   * @param {string} hash - A hash generated from the URL and payload for unique identification.
   * @param {string} url - The destination URL for the outgoing webhook.
   */
  public async createOutgoingWebhook(
    payload: Record<string, unknown>,
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
      const exponentialBackoff = calculateBackoff(
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

  /**
   * Handles errors that occur while processing an outgoing webhook.
   * If retry count is below the maximum, increments retry count and reschedules; otherwise, marks as 'FAILED'.
   * @param webhookEntity - The outgoing webhook entity.
   * @param failureDetail - Reason for the failure.
   */
  public async handleWebhookOutgoingError(
    webhookEntity: WebhookOutgoingEntity,
    failureDetail: string,
  ): Promise<void> {
    if (webhookEntity.retriesCount < this.serverConfigService.maxRetryCount) {
      const exponentialBackoff = calculateBackoff(
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
        if (err instanceof DatabaseError) {
          if (
            (err as DatabaseError).message.includes(
              PostgresErrorCodes.Duplicated,
            )
          ) {
            this.logger.warn(
              `Duplicate tracking entity for escrowAddress: ${webhookEntity.escrowAddress}. Marking webhook as completed.`,
            );
            webhookEntity.status = WebhookIncomingStatus.COMPLETED;
            await this.webhookIncomingRepository.updateOne(webhookEntity);
          } else {
            const errorId = uuidv4();
            const failureDetail = `${ErrorWebhook.PendingProcessingFailed} (Error ID: ${errorId})`;
            this.logger.error(
              `Database error for webhook processing. Error ID: ${errorId}, Webhook ID: ${webhookEntity.id}, Reason: ${failureDetail}, Message: ${err.message}`,
            );
            await this.handleWebhookIncomingError(webhookEntity, failureDetail);
            continue;
          }
        } else {
          const errorId = uuidv4();
          const failureDetail = `${ErrorWebhook.PendingProcessingFailed} (Error ID: ${errorId})`;
          this.logger.error(
            `Unexpected error processing webhook. Error ID: ${errorId}, Webhook ID: ${webhookEntity.id}, Reason: ${failureDetail}, Message: ${err.message}`,
          );
          await this.handleWebhookIncomingError(webhookEntity, failureDetail);
          continue;
        }
      }
    }
  }

  public async processPendingEscrowCompletion(): Promise<void> {
    const escrowCompletionTrackingEntities =
      await this.escrowCompletionTrackingRepository.findByStatus(
        EscrowCompletionTrackingStatus.PENDING,
      );

    for (const escrowCompletionTrackingEntity of escrowCompletionTrackingEntities) {
      try {
        const { chainId, escrowAddress, finalResultsUrl, finalResultsHash } =
          escrowCompletionTrackingEntity;

        const signer = this.web3Service.getSigner(chainId);
        const escrowClient = await EscrowClient.build(signer);

        const escrowStatus = await escrowClient.getStatus(escrowAddress);
        if (escrowStatus === EscrowStatus.Launched) {
          if (!finalResultsUrl) {
            const { url, hash } = await this.payoutService.saveResults(
              chainId,
              escrowAddress,
            );

            escrowCompletionTrackingEntity.finalResultsUrl = url;
            escrowCompletionTrackingEntity.finalResultsHash = hash;
            await this.escrowCompletionTrackingRepository.updateOne(
              escrowCompletionTrackingEntity,
            );
          }

          await this.payoutService.executePayouts(
            chainId,
            escrowAddress,
            finalResultsUrl,
            finalResultsHash,
          );
        }

        escrowCompletionTrackingEntity.status =
          EscrowCompletionTrackingStatus.PAID;
        await this.escrowCompletionTrackingRepository.updateOne(
          escrowCompletionTrackingEntity,
        );
      } catch (err) {
        const errorId = uuidv4();
        const failureDetail = `${ErrorWebhook.PendingProcessingFailed} (Error ID: ${errorId})`;
        this.logger.error(
          `Error processing escrow completion tracking. Error ID: ${errorId}, Escrow completion tracking ID: ${escrowCompletionTrackingEntity.id}, Reason: ${failureDetail}, Message: ${err.message}`,
        );
        await this.escrowCompletionTrackingService.handleEscrowCompletionTrackingError(
          escrowCompletionTrackingEntity,
          failureDetail,
        );
        continue;
      }
    }
  }

  public async processPaidEscrowCompletion(): Promise<void> {
    const escrowCompletionTrackingEntities =
      await this.escrowCompletionTrackingRepository.findByStatus(
        EscrowCompletionTrackingStatus.PAID,
      );

    // TODO: Add DB transactions
    for (const escrowCompletionTrackingEntity of escrowCompletionTrackingEntities) {
      try {
        const { chainId, escrowAddress } = escrowCompletionTrackingEntity;

        const signer = this.web3Service.getSigner(chainId);
        const escrowClient = await EscrowClient.build(signer);

        const escrowStatus = await escrowClient.getStatus(escrowAddress);
        if (escrowStatus === EscrowStatus.Paid) {
          await escrowClient.complete(escrowAddress, {
            gasPrice: await this.web3Service.calculateGasPrice(chainId),
          });

          // TODO: Assess reputation scores after completing escrow
          await this.reputationService.assessReputationScores(
            chainId,
            escrowAddress,
          );
        }

        const callbackUrls = [
          (
            await OperatorUtils.getLeader(
              chainId,
              await escrowClient.getJobLauncherAddress(escrowAddress),
            )
          ).webhookUrl,
          (
            await OperatorUtils.getLeader(
              chainId,
              await escrowClient.getExchangeOracleAddress(escrowAddress),
            )
          ).webhookUrl,
          (
            await OperatorUtils.getLeader(
              chainId,
              await escrowClient.getRecordingOracleAddress(escrowAddress),
            )
          ).webhookUrl,
        ];

        let allWebhooksCreated = true;

        for (const url of callbackUrls) {
          if (!url) {
            throw new ControlledError(
              ErrorWebhook.UrlNotFound,
              HttpStatus.NOT_FOUND,
            );
          }

          const payload = {
            chainId,
            escrowAddress,
            eventType: EventType.ESCROW_COMPLETED,
          };

          const hash = crypto
            .createHash('sha1')
            .update(stringify({ payload, url }))
            .digest('hex');

          try {
            await this.createOutgoingWebhook(payload, hash, url);
          } catch (err) {
            if (
              err instanceof DatabaseError &&
              err.message.includes(PostgresErrorCodes.Duplicated)
            ) {
              this.logger.warn(
                `Duplicate outgoing webhook for escrowAddress: ${escrowAddress}. Webhook creation skipped, but will not complete escrow until all URLs are successful.`,
              );
              continue;
            } else {
              const errorId = uuidv4();
              const failureDetail = `${ErrorWebhook.PendingProcessingFailed} (Error ID: ${errorId})`;
              this.logger.error(
                `Error creating outgoing webhook. Error ID: ${errorId}, Escrow Address: ${escrowAddress}, Reason: ${failureDetail}, Message: ${err.message}`,
              );
              await this.escrowCompletionTrackingService.handleEscrowCompletionTrackingError(
                escrowCompletionTrackingEntity,
                failureDetail,
              );
              allWebhooksCreated = false;
              break;
            }
          }
        }

        // Only set the status to COMPLETED if all webhooks were created successfully
        if (allWebhooksCreated) {
          escrowCompletionTrackingEntity.status =
            EscrowCompletionTrackingStatus.COMPLETED;
          await this.escrowCompletionTrackingRepository.updateOne(
            escrowCompletionTrackingEntity,
          );
        }
      } catch (err) {
        const errorId = uuidv4();
        const failureDetail = `${ErrorWebhook.PendingProcessingFailed} (Error ID: ${errorId})`;
        this.logger.error(
          `Error processing escrow completion tracking. Error ID: ${errorId}, Escrow completion tracking ID: ${escrowCompletionTrackingEntity.id}, Reason: ${failureDetail}, Message: ${err.message}`,
        );
        await this.escrowCompletionTrackingService.handleEscrowCompletionTrackingError(
          escrowCompletionTrackingEntity,
          failureDetail,
        );
      }
    }
  }

  public async processPendingOutgoingWebhooks(): Promise<void> {
    const webhookEntities = await this.webhookOutgoingRepository.findByStatus(
      WebhookOutgoingStatus.PENDING,
    );

    for (const webhookEntity of webhookEntities) {
      try {
        const { url, payload } = webhookEntity;
        await this.sendWebhook(url, payload);

        webhookEntity.status = WebhookOutgoingStatus.SENT;
        await this.webhookOutgoingRepository.updateOne(webhookEntity);
      } catch (err) {
        const errorId = uuidv4();
        const failureDetail = `${ErrorWebhook.PendingProcessingFailed} (Error ID: ${errorId})`;
        console.error(
          `Error processing outgoing webhook. Error ID: ${errorId}, Webhook ID: ${webhookEntity.id}, Message: ${err.message}`,
        );
        await this.handleWebhookOutgoingError(webhookEntity, failureDetail);
      }
    }
  }
}
