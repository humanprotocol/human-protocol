import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HttpModule } from '@nestjs/axios';
import { Web3Module } from '../web3/web3.module';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { WebhookIncomingEntity } from './webhook-incoming.entity';
import { WebhookOutgoingEntity } from './webhook-outgoing.entity';
import { WebhookIncomingRepository } from './webhook-incoming.repository';
import { WebhookOutgoingRepository } from './webhook-outgoing.repository';
import { EscrowCompletionTrackingModule } from '../escrow-completion-tracking/escrow-completion-tracking.module';
import { EscrowCompletionTrackingRepository } from '../escrow-completion-tracking/escrow-completion-tracking.repository';
import { PayoutModule } from '../payout/payout.module';
import { ReputationModule } from '../reputation/reputation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WebhookIncomingEntity,
      WebhookOutgoingEntity,
      EscrowCompletionTrackingRepository,
    ]),
    ConfigModule,
    Web3Module,
    HttpModule,
    EscrowCompletionTrackingModule,
    PayoutModule,
    ReputationModule,
  ],
  controllers: [WebhookController],
  providers: [
    Logger,
    WebhookService,
    WebhookIncomingRepository,
    WebhookOutgoingRepository,
  ],
  exports: [WebhookService],
})
export class WebhookModule {}
