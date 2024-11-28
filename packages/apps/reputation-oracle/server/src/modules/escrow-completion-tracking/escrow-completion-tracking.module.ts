import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EscrowCompletionTrackingEntity } from './escrow-completion-tracking.entity';
import { EscrowCompletionTrackingRepository } from './escrow-completion-tracking.repository';
import { EscrowCompletionTrackingService } from './escrow-completion-tracking.service';
import { PayoutModule } from '../payout/payout.module';
import { ReputationModule } from '../reputation/reputation.module';
import { Web3Module } from '../web3/web3.module';
import { WebhookOutgoingModule } from '../webhook/webhook-outgoing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EscrowCompletionTrackingEntity]),
    ConfigModule,
    Web3Module,
    PayoutModule,
    ReputationModule,
    WebhookOutgoingModule,
  ],
  providers: [
    Logger,
    EscrowCompletionTrackingService,
    EscrowCompletionTrackingRepository,
  ],
  exports: [EscrowCompletionTrackingService],
})
export class EscrowCompletionTrackingModule {}
