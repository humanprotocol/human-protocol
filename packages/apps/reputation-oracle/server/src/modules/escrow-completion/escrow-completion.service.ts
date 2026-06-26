import crypto from 'crypto';

import {
  ESCROW_BULK_PAYOUT_MAX_ITEMS,
  ChainId,
  EscrowClient,
  EscrowStatus,
  EscrowUtils,
  OperatorUtils,
} from '@human-protocol/sdk';
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import stringify from 'json-stable-stringify';
import _ from 'lodash';

import { BACKOFF_INTERVAL_SECONDS } from '@/common/constants';
import { JobManifest, JobRequestType } from '@/common/types';
import { ServerConfigService, Web3ConfigService } from '@/config';
import { isDuplicatedError } from '@/database';
import logger from '@/logger';
import { ReputationService } from '@/modules/reputation';
import { ReputationEntityType } from '@/modules/reputation/constants';
import { StorageService } from '@/modules/storage';
import { Web3Service } from '@/modules/web3';
/**
 * Import webhook-related items directly to avoid circular dependency
 */
import { OutgoingWebhookEventType } from '@/modules/webhook/types';
import { OutgoingWebhookService } from '@/modules/webhook/webhook-outgoing.service';
import { calculateExponentialBackoffMs } from '@/utils/backoff';
import * as manifestUtils from '@/utils/manifest';

import { EscrowCompletionStatus } from './constants';
import { EscrowCompletionEntity } from './escrow-completion.entity';
import { EscrowCompletionRepository } from './escrow-completion.repository';
import { EscrowPayoutsBatchEntity } from './escrow-payouts-batch.entity';
import { EscrowPayoutsBatchRepository } from './escrow-payouts-batch.repository';
import {
  CvatPayoutsCalculator,
  DefaultPayoutsCalculator,
  EscrowPayoutsCalculator,
  CalculatedPayout,
} from './payouts-calculation';
import {
  CvatResultsProcessor,
  DefaultResultsProcessor,
  EscrowResultsProcessor,
} from './results-processing';

@Injectable()
export class EscrowCompletionService {
  private readonly logger = logger.child({
    context: EscrowCompletionService.name,
  });

  constructor(
    private readonly serverConfigService: ServerConfigService,
    private readonly escrowCompletionRepository: EscrowCompletionRepository,
    private readonly escrowPayoutsBatchRepository: EscrowPayoutsBatchRepository,
    private readonly web3Service: Web3Service,
    private readonly web3ConfigService: Web3ConfigService,
    private readonly storageService: StorageService,
    private readonly outgoingWebhookService: OutgoingWebhookService,
    private readonly reputationService: ReputationService,
    private readonly cvatResultsProcessor: CvatResultsProcessor,
    private readonly defaultResultsProcessor: DefaultResultsProcessor,
    private readonly cvatPayoutsCalculator: CvatPayoutsCalculator,
    private readonly defaultPayoutsCalculator: DefaultPayoutsCalculator,
  ) {}

  async createEscrowCompletion(
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<void> {
    const escrowCompletionEntity = new EscrowCompletionEntity();
    escrowCompletionEntity.chainId = chainId;
    escrowCompletionEntity.escrowAddress = escrowAddress;
    escrowCompletionEntity.status = EscrowCompletionStatus.PENDING;
    escrowCompletionEntity.waitUntil = new Date();
    escrowCompletionEntity.retriesCount = 0;

    await this.escrowCompletionRepository.createUnique(escrowCompletionEntity);
  }

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

  async processPendingRecords(): Promise<void> {
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
        let toComplete = false;
        if (
          escrowStatus === EscrowStatus.Pending ||
          escrowStatus === EscrowStatus.ToCancel
        ) {
          const escrowData = await EscrowUtils.getEscrow(
            escrowCompletionEntity.chainId,
            escrowCompletionEntity.escrowAddress,
          );
          if (!escrowData) {
            throw new Error('Escrow data is missing');
          }

          const { manifest, encrypted: isManifestEncrypted } =
            await this.storageService.downloadManifest(
              escrowData.manifest as string,
            );
          const jobRequestType = manifestUtils.getJobRequestType(manifest);

          if (!escrowCompletionEntity.finalResultsUrl) {
            const escrowResultsProcessor =
              this.getEscrowResultsProcessor(jobRequestType);

            const { url, hash } = await escrowResultsProcessor.storeResults(
              escrowCompletionEntity.chainId,
              escrowCompletionEntity.escrowAddress,
              manifest,
              isManifestEncrypted,
            );

            escrowCompletionEntity.finalResultsUrl = url;
            escrowCompletionEntity.finalResultsHash = hash;
            await this.escrowCompletionRepository.updateOne(
              escrowCompletionEntity,
            );
          }

          const payoutsCalculator =
            this.getEscrowPayoutsCalculator(jobRequestType);
          const calculatedPayouts = await payoutsCalculator.calculate({
            manifest,
            chainId: escrowCompletionEntity.chainId,
            escrowAddress: escrowCompletionEntity.escrowAddress,
            finalResultsUrl: escrowCompletionEntity.finalResultsUrl,
          });

          toComplete = calculatedPayouts.length === 0;
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
        if (escrowStatus === EscrowStatus.Cancelled || toComplete) {
          escrowCompletionEntity.status = EscrowCompletionStatus.PAID;
        }
        await this.escrowCompletionRepository.updateOne(escrowCompletionEntity);
      } catch (error) {
        this.logger.error('Failed to process pending escrow completion', {
          error,
          escrowCompletionEntityId: escrowCompletionEntity.id,
        });

        await this.handleEscrowCompletionError(
          escrowCompletionEntity,
          `Error message: ${error.message}`,
        );
        continue;
      }
    }
  }

  async processPaidEscrows(): Promise<void> {
    const escrowCompletionEntities =
      await this.escrowCompletionRepository.findByStatus(
        EscrowCompletionStatus.PAID,
      );

    for (const escrowCompletionEntity of escrowCompletionEntities) {
      try {
        const { chainId, escrowAddress } = escrowCompletionEntity;

        const signer = this.web3Service.getSigner(chainId);
        const escrowClient = await EscrowClient.build(signer);

        const escrowData = await EscrowUtils.getEscrow(chainId, escrowAddress);
        if (!escrowData) {
          throw new Error('Escrow data is missing');
        }

        let escrowStatus = await escrowClient.getStatus(escrowAddress);
        if (
          [
            EscrowStatus.Partial,
            EscrowStatus.Paid,
            EscrowStatus.ToCancel,
            EscrowStatus.Pending,
          ].includes(escrowStatus)
        ) {
          const feeOverrides = await this.web3Service.calculateTxFees(chainId);

          if (escrowStatus === EscrowStatus.ToCancel) {
            await escrowClient.cancel(escrowAddress, {
              ...feeOverrides,
              timeoutMs: this.web3ConfigService.txTimeoutMs,
            });
            escrowStatus = EscrowStatus.Cancelled;
          } else {
            await escrowClient.complete(escrowAddress, {
              ...feeOverrides,
              timeoutMs: this.web3ConfigService.txTimeoutMs,
            });
            escrowStatus = EscrowStatus.Complete;
          }

          /**
           * This operation can fail and lost, so it's "at most once"
           */
          const jobRequestType =
            await this.getJobRequestTypeFromEscrowData(escrowData);
          await this.reputationService.assessEscrowParties(
            chainId,
            escrowData.launcher,
            escrowData.exchangeOracle!,
            escrowData.recordingOracle!,
            jobRequestType,
          );
        }

        const oracleAddresses: string[] = [
          escrowData.launcher as string,
          escrowData.exchangeOracle as string,
        ];

        const webhookPayload = {
          chainId,
          escrowAddress,
          eventType:
            escrowStatus === EscrowStatus.Cancelled
              ? OutgoingWebhookEventType.ESCROW_CANCELED
              : OutgoingWebhookEventType.ESCROW_COMPLETED,
        };

        let allWebhooksCreated = true;
        for (const oracleAddress of oracleAddresses) {
          const oracleData = await OperatorUtils.getOperator(
            chainId,
            oracleAddress,
          );
          if (!oracleData) {
            throw new Error('Oracle data is missing');
          }

          const { webhookUrl } = oracleData;
          if (!webhookUrl) {
            this.logger.error('Webhook url is not set for this oracle', {
              escrowCompletionEntityId: escrowCompletionEntity.id,
              oracleAddress,
            });
            continue;
          }

          try {
            await this.outgoingWebhookService.createOutgoingWebhook(
              webhookPayload,
              webhookUrl,
            );
          } catch (error) {
            if (isDuplicatedError(error)) {
              /**
               * Already created. Noop.
               */
              continue;
            } else {
              this.logger.error(
                'Failed to create outgoing webhook for oracle',
                {
                  error,
                  escrowCompletionEntityId: escrowCompletionEntity.id,
                  oracleAddress,
                },
              );

              await this.handleEscrowCompletionError(
                escrowCompletionEntity,
                `Failed to create outgoing webhook for oracle. Address: ${oracleAddress}.`,
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
      } catch (error) {
        this.logger.error('Failed to process paid escrow completion', {
          error,
          escrowCompletionEntityId: escrowCompletionEntity.id,
        });

        await this.handleEscrowCompletionError(
          escrowCompletionEntity,
          `Error message: ${error.message}`,
        );
      }
    }
  }

  private async createEscrowPayoutsBatch(
    escrowCompletionId: number,
    payoutsBatch: CalculatedPayout[],
  ): Promise<void> {
    const formattedPayouts = payoutsBatch.map((payout) => ({
      ...payout,
      amount: payout.amount.toString(),
    }));

    const batchHash = crypto
      .createHash('sha256')
      .update(stringify(formattedPayouts) as string)
      .digest('hex');

    const escrowPayoutsBatchEntity = new EscrowPayoutsBatchEntity();
    escrowPayoutsBatchEntity.escrowCompletionTrackingId = escrowCompletionId;
    escrowPayoutsBatchEntity.payouts = formattedPayouts;
    escrowPayoutsBatchEntity.payoutsHash = batchHash;

    await this.escrowPayoutsBatchRepository.createUnique(
      escrowPayoutsBatchEntity,
    );
  }

  async processAwaitingPayouts(): Promise<void> {
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
            this.logger.error(`Failed to process payouts batch`, {
              error,
              payoutsBatchId: payoutsBatch.id,
            });
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
        this.logger.error('Failed to process payouts', {
          error,
          escrowCompletionEntityId: escrowCompletionEntity.id,
        });

        await this.handleEscrowCompletionError(
          escrowCompletionEntity,
          `Error message: ${error.message}`,
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
      escrowCompletionEntity.finalResultsUrl as string,
      escrowCompletionEntity.finalResultsHash as string,
      crypto.randomUUID(), // TODO obtain it from intermediate results
      false,
      {
        ...(await this.web3Service.calculateTxFees(
          escrowCompletionEntity.chainId,
        )),
        nonce: payoutsBatch.txNonce,
      },
    );

    if (!payoutsBatch.txNonce) {
      payoutsBatch.txNonce = rawTransaction.nonce;
      await this.escrowPayoutsBatchRepository.updateOne(payoutsBatch);
    }

    try {
      const transactionResponse = await signer.sendTransaction(rawTransaction);
      await transactionResponse.wait(
        undefined,
        this.web3ConfigService.txTimeoutMs,
      );

      await this.escrowPayoutsBatchRepository.deleteOne(payoutsBatch);
      const escrowData = await EscrowUtils.getEscrow(
        escrowCompletionEntity.chainId,
        escrowCompletionEntity.escrowAddress,
      );
      const jobRequestType =
        await this.getJobRequestTypeFromEscrowData(escrowData);
      await this.increasePayoutRecipientsReputation(
        escrowCompletionEntity.chainId,
        Array.from(recipientToAmountMap.keys()),
        jobRequestType,
      );
    } catch (error) {
      if (ethers.isError(error, 'NONCE_EXPIRED')) {
        payoutsBatch.txNonce = null;
        await this.escrowPayoutsBatchRepository.updateOne(payoutsBatch);
      }

      throw error;
    }
  }

  private async increasePayoutRecipientsReputation(
    chainId: ChainId,
    recipients: string[],
    jobRequestType: JobRequestType,
  ): Promise<void> {
    for (const address of recipients) {
      try {
        await this.reputationService.increaseReputation(
          {
            chainId,
            address,
            type: ReputationEntityType.WORKER,
            jobRequestType,
          },
          1,
        );
      } catch (error) {
        this.logger.error('Failed to increase payout recipient reputation', {
          error,
          address,
          chainId,
          jobRequestType,
        });
      }
    }
  }

  private async getJobRequestTypeFromEscrowData(
    escrowData: Awaited<ReturnType<typeof EscrowUtils.getEscrow>>,
  ): Promise<JobRequestType> {
    if (!escrowData) {
      throw new Error('Escrow data is missing');
    }

    const manifest =
      await this.storageService.downloadJsonLikeData<JobManifest>(
        escrowData.manifest as string,
      );

    return manifestUtils.getJobRequestType(manifest);
  }

  private getEscrowResultsProcessor(
    jobRequestType: JobRequestType,
  ): EscrowResultsProcessor {
    if (manifestUtils.isCvatJobType(jobRequestType)) {
      return this.cvatResultsProcessor;
    }

    return this.defaultResultsProcessor;
  }

  private getEscrowPayoutsCalculator(
    jobRequestType: JobRequestType,
  ): EscrowPayoutsCalculator {
    if (manifestUtils.isCvatJobType(jobRequestType)) {
      return this.cvatPayoutsCalculator;
    }

    return this.defaultPayoutsCalculator;
  }
}
