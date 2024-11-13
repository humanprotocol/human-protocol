/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@nestjs/common';
import { EscrowCompletionTrackingStatus } from '../../common/enums';
import { ServerConfigService } from '../../common/config/server-config.service';
import { EscrowCompletionTrackingRepository } from './escrow-completion-tracking.repository';
import { EscrowCompletionTrackingEntity } from './escrow-completion-tracking.entity';
import { ChainId } from '@human-protocol/sdk';

@Injectable()
export class EscrowCompletionTrackingService {
  constructor(
    private readonly escrowCompletionTrackingRepository: EscrowCompletionTrackingRepository,
    public readonly serverConfigService: ServerConfigService,
  ) {}

  /**
   * Creates a tracking record for escrow completion in the repository.
   * Sets initial status to 'PENDING'.
   * @param {ChainId} chainId - The blockchain chain ID.
   * @param {string} escrowAddress - The address of the escrow contract.
   */
  public async createEscrowCompletionTracking(
    chainId: ChainId,
    escrowAddress: string,
  ): Promise<void> {
    let escrowCompletionTrackingEntity = new EscrowCompletionTrackingEntity();
    escrowCompletionTrackingEntity.chainId = chainId;
    escrowCompletionTrackingEntity.escrowAddress = escrowAddress;
    escrowCompletionTrackingEntity.status =
      EscrowCompletionTrackingStatus.PENDING;
    escrowCompletionTrackingEntity.waitUntil = new Date();
    escrowCompletionTrackingEntity.retriesCount = 0;

    escrowCompletionTrackingEntity =
      await this.escrowCompletionTrackingRepository.createUnique(
        escrowCompletionTrackingEntity,
      );
  }

  /**
   * Handles errors that occur during escrow completion tracking.
   * If retry count is below the maximum, increments retry count and reschedules; otherwise, marks as 'FAILED'.
   * @param escrowCompletionTrackingEntity - The escrow tracking entity.
   * @param failedReason - Reason for the failure.
   */
  public async handleEscrowCompletionTrackingError(
    escrowCompletionTrackingEntity: EscrowCompletionTrackingEntity,
    failedReason: string,
  ): Promise<void> {
    if (
      escrowCompletionTrackingEntity.retriesCount <
      this.serverConfigService.maxRetryCount
    ) {
      escrowCompletionTrackingEntity.waitUntil = new Date();
      escrowCompletionTrackingEntity.retriesCount += 1;
    } else {
      escrowCompletionTrackingEntity.failedReason = failedReason;
      escrowCompletionTrackingEntity.status =
        EscrowCompletionTrackingStatus.FAILED;
    }
    await this.escrowCompletionTrackingRepository.updateOne(
      escrowCompletionTrackingEntity,
    );
  }
}
