import { Module } from '@nestjs/common';

import { ReputationModule } from '@/modules/reputation';
import { StorageModule } from '@/modules/storage';
import { Web3Module } from '@/modules/web3';
/**
 * Import webhook-related items directly to avoid circular dependency
 */
import { OutgoingWebhookModule } from '@/modules/webhook/webhook-outgoing.module';

import { EscrowCompletionRepository } from './escrow-completion.repository';
import { EscrowCompletionService } from './escrow-completion.service';
import { EscrowPayoutsBatchRepository } from './escrow-payouts-batch.repository';
import { EscrowPayoutsCalculationModule } from './payouts-calculation/module';
import { EscrowResultsProcessingModule } from './results-processing/module';

@Module({
  imports: [
    EscrowResultsProcessingModule,
    EscrowPayoutsCalculationModule,
    StorageModule,
    Web3Module,
    ReputationModule,
    OutgoingWebhookModule,
  ],
  providers: [
    EscrowCompletionService,
    EscrowCompletionRepository,
    EscrowPayoutsBatchRepository,
  ],
  exports: [EscrowCompletionService],
})
export class EscrowCompletionModule {}
