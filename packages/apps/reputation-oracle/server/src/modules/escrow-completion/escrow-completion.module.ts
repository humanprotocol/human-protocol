import { Module } from '@nestjs/common';

import { EncryptionModule } from '../encryption/encryption.module';
import { PayoutModule } from '../payout/payout.module';
import { ReputationModule } from '../reputation/reputation.module';
import { StorageModule } from '../storage/storage.module';
import { Web3Module } from '../web3/web3.module';
import { OutgoingWebhookModule } from '../webhook/webhook-outgoing.module';

import { EscrowCompletionRepository } from './escrow-completion.repository';
import { EscrowCompletionService } from './escrow-completion.service';
import { EscrowPayoutsBatchRepository } from './escrow-payouts-batch.repository';
import {
  AudinoResultsProcessor,
  CvatResultsProcessor,
  FortuneResultsProcessor,
} from './results-processing';
import {
  AudinoPayoutsCalculator,
  CvatPayoutsCalculator,
  FortunePayoutsCalculator,
} from './payouts-calculation';

@Module({
  imports: [
    EncryptionModule,
    StorageModule,
    Web3Module,
    PayoutModule,
    ReputationModule,
    OutgoingWebhookModule,
  ],
  providers: [
    EscrowCompletionService,
    EscrowCompletionRepository,
    EscrowPayoutsBatchRepository,
    AudinoResultsProcessor,
    FortuneResultsProcessor,
    CvatResultsProcessor,
    AudinoPayoutsCalculator,
    CvatPayoutsCalculator,
    FortunePayoutsCalculator,
  ],
  exports: [EscrowCompletionService],
})
export class EscrowCompletionModule {}
