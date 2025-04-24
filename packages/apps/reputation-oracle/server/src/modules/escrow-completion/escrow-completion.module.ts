import { Module } from '@nestjs/common';

import { PayoutModule } from '../payout/payout.module';
import { ReputationModule } from '../reputation/reputation.module';
import { Web3Module } from '../web3/web3.module';
import { OutgoingWebhookModule } from '../webhook/webhook-outgoing.module';

import { EscrowCompletionRepository } from './escrow-completion.repository';
import { EscrowCompletionService } from './escrow-completion.service';
import { EscrowPayoutsBatchRepository } from './escrow-payouts-batch.repository';

@Module({
  imports: [Web3Module, PayoutModule, ReputationModule, OutgoingWebhookModule],
  providers: [
    EscrowCompletionService,
    EscrowCompletionRepository,
    EscrowPayoutsBatchRepository,
  ],
  exports: [EscrowCompletionService],
})
export class EscrowCompletionModule {}
