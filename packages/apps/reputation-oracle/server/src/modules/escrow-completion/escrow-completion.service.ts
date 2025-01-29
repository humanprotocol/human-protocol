/* eslint-disable @typescript-eslint/no-non-null-assertion */
import crypto from 'crypto';
import { ethers } from 'ethers';
import stringify from 'json-stable-stringify';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { Injectable, Logger } from '@nestjs/common';
import { EscrowCompletionStatus, EventType } from '../../common/enums';
import { ServerConfigService } from '../../common/config/server-config.service';
import { EscrowCompletionRepository } from './escrow-completion.repository';
import { EscrowCompletionEntity } from './escrow-completion.entity';
import {
  ESCROW_BULK_PAYOUT_MAX_ITEMS,
  ChainId,
  EscrowClient,
  EscrowStatus,
  OperatorUtils,
} from '@human-protocol/sdk';
import { calculateExponentialBackoffMs } from '../../common/utils/backoff';
import {
  BACKOFF_INTERVAL_SECONDS,
  DEFAULT_BULK_PAYOUT_TX_ID,
} from '../../common/constants';
import { WebhookIncomingService } from '../webhook/webhook-incoming.service';
import { PayoutService } from '../payout/payout.service';
import { ReputationService } from '../reputation/reputation.service';
import { Web3Service } from '../web3/web3.service';
import { ErrorEscrowCompletion } from '../../common/constants/errors';
import { WebhookOutgoingService } from '../webhook/webhook-outgoing.service';
import { isDuplicatedError } from '../../common/utils/database';
import { CalculatedPayout } from '../payout/payout.interface';
import { EscrowPayoutsBatchEntity } from './escrow-payouts-batch.entity';
import { EscrowPayoutsBatchRepository } from './escrow-payouts-batch.repository';

@Injectable()
export class EscrowCompletionService {
  private readonly logger = new Logger(WebhookIncomingService.name);

  constructor(
    private readonly escrowCompletionRepository: EscrowCompletionRepository,
    private readonly escrowPayoutsBatchRepository: EscrowPayoutsBatchRepository,
    private readonly web3Service: Web3Service,
    private readonly webhookOutgoingService: WebhookOutgoingService,
    private readonly payoutService: PayoutService,
    private readonly reputationService: ReputationService,
    public readonly serverConfigService: ServerConfigService,
  ) {}

  /**
   * Creates a tracking record for escrow completion in the repository.
   * Sets initial status to 'PENDING'.
   * @param {ChainId} chainId - The blockchain chain ID.
   * @param {string} escrowAddress - The address of the escrow contract.
   */
  public async createEscrowCompletion(
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<void> {
    let escrowCompletionEntity = new EscrowCompletionEntity();
    escrowCompletionEntity.chainId = chainId;
    escrowCompletionEntity.escrowAddress = escrowAddress;
    escrowCompletionEntity.status = EscrowCompletionStatus.PENDING;
    escrowCompletionEntity.waitUntil = new Date();
    escrowCompletionEntity.retriesCount = 0;

    escrowCompletionEntity = await this.escrowCompletionRepository.createUnique(
      escrowCompletionEntity,
    );
  }

  /**
   * Handles errors that occur during escrow completion.
   * If retry count is below the maximum, increments retry count and reschedules; otherwise, marks as 'FAILED'.
   * @param escrowCompletionEntity - The escrow entity.
   * @param failureDetail - Reason for the failure.
   */
  private async handleEscrowCompletionError(
    escrowCompletionEntity: EscrowCompletionEntity,
    failureDetail: string,
  ): Promise<void> {
    if (
      escrowCompletionEntity.retriesCount <
      this.serverConfigService.maxRetryCount
    ) {
      const exponentialBackoff = calculateExponentialBackoffMs(
        escrowCompletionEntity.retriesCount,
        BACKOFF_INTERVAL_SECONDS,
      );
      escrowCompletionEntity.waitUntil = new Date(
        Date.now() + exponentialBackoff,
      );
      escrowCompletionEntity.retriesCount += 1;
    } else {
      escrowCompletionEntity.failureDetail = failureDetail;
      escrowCompletionEntity.status = EscrowCompletionStatus.FAILED;
    }
    await this.escrowCompletionRepository.updateOne(escrowCompletionEntity);
  }

  public async processPendingEscrowCompletion(): Promise<void> {
    const escrowCompletionEntities =
      await this.escrowCompletionRepository.findByStatus(
        EscrowCompletionStatus.PENDING,
      );

    for (const escrowCompletionEntity of escrowCompletionEntities) {
      try {
        const signer = this.web3Service.getSigner(
          escrowCompletionEntity.chainId,
        );
        const escrowClient = await EscrowClient.build(signer);

        const escrowStatus = await escrowClient.getStatus(
          escrowCompletionEntity.escrowAddress,
        );
        if (escrowStatus === EscrowStatus.Pending) {
          if (!escrowCompletionEntity.finalResultsUrl) {
            const { url, hash } = await this.payoutService.processResults(
              escrowCompletionEntity.chainId,
              escrowCompletionEntity.escrowAddress,
            );

            escrowCompletionEntity.finalResultsUrl = url;
            escrowCompletionEntity.finalResultsHash = hash;
            await this.escrowCompletionRepository.updateOne(
              escrowCompletionEntity,
            );
          }

          const calculatedPayouts = await this.payoutService.calculatePayouts(
            escrowCompletionEntity.chainId,
            escrowCompletionEntity.escrowAddress,
            escrowCompletionEntity.finalResultsUrl,
          );

          /**
           * When creating payout batches we need to guarantee deterministic result,
           * so order it first.
           */
          const payoutBatches = _.chunk(
            _.orderBy(calculatedPayouts, 'address', 'asc'),
            ESCROW_BULK_PAYOUT_MAX_ITEMS,
          );

          await Promise.all(
            payoutBatches.map(async (payoutsBatch) => {
              try {
                await this.createEscrowPayoutsBatch(
                  escrowCompletionEntity.id,
                  payoutsBatch,
                );
              } catch (error) {
                if (isDuplicatedError(error)) {
                  /**
                   * Already created. Noop.
                   */
                  return;
                }

                throw error;
              }
            }),
          );
        }

        escrowCompletionEntity.status = EscrowCompletionStatus.AWAITING_PAYOUTS;
        await this.escrowCompletionRepository.updateOne(escrowCompletionEntity);
      } catch (error) {
        const errorId = uuidv4();
        const failureDetail = `${ErrorEscrowCompletion.PendingProcessingFailed} (Error ID: ${errorId})`;
        this.logger.error(
          `Error processing escrow completion. Error ID: ${errorId}, Escrow completion ID: ${escrowCompletionEntity.id}, Reason: ${failureDetail}, Message: ${error.message}`,
        );
        await this.handleEscrowCompletionError(
          escrowCompletionEntity,
          failureDetail,
        );
        continue;
      }
    }
  }

  public async processPaidEscrowCompletion(): Promise<void> {
    const escrowCompletionEntities =
      await this.escrowCompletionRepository.findByStatus(
        EscrowCompletionStatus.PAID,
      );

    // TODO: Add DB transactions
    for (const escrowCompletionEntity of escrowCompletionEntities) {
      try {
        const { chainId, escrowAddress } = escrowCompletionEntity;

        const signer = this.web3Service.getSigner(chainId);
        const escrowClient = await EscrowClient.build(signer);

        const escrowStatus = await escrowClient.getStatus(escrowAddress);

        if ([EscrowStatus.Partial, EscrowStatus.Paid].includes(escrowStatus)) {
          await escrowClient.complete(escrowAddress, {
            gasPrice: await this.web3Service.calculateGasPrice(chainId),
          });

          // TODO: Technically it's possible that the escrow completion could occur before the reputation scores are assessed,
          // and the app might go down during this window. Currently, there isn’t a clear approach to handle this situation.
          // Consider revisiting this section to explore potential solutions to improve resilience in such scenarios.
          await this.reputationService.assessReputationScores(
            chainId,
            escrowAddress,
          );
        }

        const oracleAddresses = await Promise.all([
          escrowClient.getJobLauncherAddress(escrowAddress),
          escrowClient.getExchangeOracleAddress(escrowAddress),
          // escrowClient.getRecordingOracleAddress(escrowAddress),
        ]);

        const webhookPayload = {
          chainId,
          escrowAddress,
          eventType: EventType.ESCROW_COMPLETED,
        };

        let allWebhooksCreated = true;

        for (const oracleAddress of oracleAddresses) {
          const oracleData = await OperatorUtils.getLeader(
            chainId,
            oracleAddress,
          );
          if (!oracleData) {
            throw new Error('Oracle data is missing');
          }

          const { webhookUrl } = oracleData;
          if (!webhookUrl) {
            throw new Error('Webhook url is no set for oracle');
          }

          try {
            await this.webhookOutgoingService.createOutgoingWebhook(
              webhookPayload,
              webhookUrl,
            );
          } catch (err) {
            if (isDuplicatedError(err)) {
              /**
               * Already created. Noop.
               */
              continue;
            } else {
              const errorId = uuidv4();
              const failureDetail = `${ErrorEscrowCompletion.PaidProcessingFailed} (Error ID: ${errorId})`;
              this.logger.error(
                `Error creating outgoing webhook. Error ID: ${errorId}, Escrow Address: ${escrowAddress}, Reason: ${failureDetail}, Message: ${err.message}`,
              );
              await this.handleEscrowCompletionError(
                escrowCompletionEntity,
                failureDetail,
              );
              allWebhooksCreated = false;
              break;
            }
          }
        }

        // Only set the status to COMPLETED if all webhooks were created successfully
        if (allWebhooksCreated) {
          escrowCompletionEntity.status = EscrowCompletionStatus.COMPLETED;
          await this.escrowCompletionRepository.updateOne(
            escrowCompletionEntity,
          );
        }
      } catch (err) {
        const errorId = uuidv4();
        const failureDetail = `${ErrorEscrowCompletion.PaidProcessingFailed} (Error ID: ${errorId})`;
        this.logger.error(
          `Error processing escrow completion. Error ID: ${errorId}, Escrow completion ID: ${escrowCompletionEntity.id}, Reason: ${failureDetail}, Message: ${err.message}`,
        );
        await this.handleEscrowCompletionError(
          escrowCompletionEntity,
          failureDetail,
        );
      }
    }
  }

  public async createEscrowPayoutsBatch(
    escrowCompletionId: number,
    payoutsBatch: CalculatedPayout[],
  ): Promise<void> {
    const formattedPayouts = payoutsBatch.map((payout) => ({
      ...payout,
      amount: payout.amount.toString(),
    }));

    const batchHash = crypto
      .createHash('sha1')
      .update(stringify(formattedPayouts))
      .digest('hex');

    const escrowPayoutsBatchEntity = new EscrowPayoutsBatchEntity();
    escrowPayoutsBatchEntity.escrowCompletionTrackingId = escrowCompletionId;
    escrowPayoutsBatchEntity.payouts = formattedPayouts;
    escrowPayoutsBatchEntity.payoutsHash = batchHash;

    await this.escrowPayoutsBatchRepository.createUnique(
      escrowPayoutsBatchEntity,
    );
  }

  public async processAwaitingPayouts(): Promise<void> {
    const escrowCompletionEntities =
      await this.escrowCompletionRepository.findByStatus(
        EscrowCompletionStatus.AWAITING_PAYOUTS,
      );

    for (const escrowCompletionEntity of escrowCompletionEntities) {
      try {
        const payoutBatches =
          await this.escrowPayoutsBatchRepository.findForEscrowCompletionTracking(
            escrowCompletionEntity.id,
          );

        let hasFailedPayouts = false;
        for (const payoutsBatch of payoutBatches) {
          try {
            await this.processPayoutsBatch(
              escrowCompletionEntity,
              payoutsBatch,
            );
          } catch (error) {
            this.logger.error(
              `Failed to process payouts batch ${payoutsBatch.id}`,
              error,
            );
            hasFailedPayouts = true;
          }
        }

        if (hasFailedPayouts) {
          throw new Error('Not all payouts batches succeeded');
        } else {
          escrowCompletionEntity.status = EscrowCompletionStatus.PAID;
          await this.escrowCompletionRepository.updateOne(
            escrowCompletionEntity,
          );
        }
      } catch (error) {
        const errorId = uuidv4();
        const failureDetail = `${ErrorEscrowCompletion.AwaitingPayoutsProcessingFailed} (Error ID: ${errorId})`;
        this.logger.error(
          `Error processing escrow completion. Error ID: ${errorId}, Escrow completion ID: ${escrowCompletionEntity.id}, Reason: ${failureDetail}, Message: ${error.message}`,
        );
        await this.handleEscrowCompletionError(
          escrowCompletionEntity,
          failureDetail,
        );
        continue;
      }
    }
  }

  private async processPayoutsBatch(
    escrowCompletionEntity: EscrowCompletionEntity,
    payoutsBatch: EscrowPayoutsBatchEntity,
  ): Promise<void> {
    const signer = this.web3Service.getSigner(escrowCompletionEntity.chainId);
    const escrowClient = await EscrowClient.build(signer);

    const recipientToAmountMap = new Map<string, bigint>();
    for (const { address, amount } of payoutsBatch.payouts) {
      recipientToAmountMap.set(address, BigInt(amount));
    }

    const rawTransaction = await escrowClient.createBulkPayoutTransaction(
      escrowCompletionEntity.escrowAddress,
      Array.from(recipientToAmountMap.keys()),
      Array.from(recipientToAmountMap.values()),
      escrowCompletionEntity.finalResultsUrl,
      escrowCompletionEntity.finalResultsHash,
      DEFAULT_BULK_PAYOUT_TX_ID,
      false,
      {
        gasPrice: await this.web3Service.calculateGasPrice(
          escrowCompletionEntity.chainId,
        ),
        nonce: payoutsBatch.txNonce,
      },
    );

    if (!payoutsBatch.txNonce) {
      payoutsBatch.txNonce = rawTransaction.nonce;
    }

    await this.escrowPayoutsBatchRepository.updateOne(payoutsBatch);

    try {
      const transactionResponse = await signer.sendTransaction(rawTransaction);
      await transactionResponse.wait();

      await this.escrowPayoutsBatchRepository.deleteOne(payoutsBatch);
    } catch (error) {
      if (ethers.isError(error, 'NONCE_EXPIRED')) {
        delete payoutsBatch.txNonce;
        await this.escrowPayoutsBatchRepository.updateOne(payoutsBatch);
      }

      throw error;
    }
  }
}
