import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EscrowCompletionEntity } from './escrow-completion.entity';
import { EscrowCompletionRepository } from './escrow-completion.repository';
import { EscrowCompletionService } from './escrow-completion.service';
import { PayoutModule } from '../payout/payout.module';
import { ReputationModule } from '../reputation/reputation.module';
import { Web3Module } from '../web3/web3.module';
import { WebhookOutgoingModule } from '../webhook/webhook-outgoing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EscrowCompletionEntity]),
    ConfigModule,
    Web3Module,
    PayoutModule,
    ReputationModule,
    WebhookOutgoingModule,
  ],
  providers: [Logger, EscrowCompletionService, EscrowCompletionRepository],
  exports: [EscrowCompletionService],
})
export class EscrowCompletionModule {}
