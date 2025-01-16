import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EscrowCompletionRepository } from './escrow-completion.repository';
import { EscrowCompletionService } from './escrow-completion.service';
import { PayoutModule } from '../payout/payout.module';
import { ReputationModule } from '../reputation/reputation.module';
import { Web3Module } from '../web3/web3.module';
import { WebhookOutgoingModule } from '../webhook/webhook-outgoing.module';
import { EscrowPayoutsBatchRepository } from './escrow-payouts-batch.repository';

@Module({
  imports: [
    ConfigModule,
    Web3Module,
    PayoutModule,
    ReputationModule,
    WebhookOutgoingModule,
  ],
  providers: [
    Logger,
    EscrowCompletionService,
    EscrowCompletionRepository,
    EscrowPayoutsBatchRepository,
  ],
  exports: [EscrowCompletionService],
})
export class EscrowCompletionModule {}
