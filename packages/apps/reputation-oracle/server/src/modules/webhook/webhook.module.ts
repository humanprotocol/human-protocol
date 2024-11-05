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
import { EscrowCompletionTrackingEntity } from './escrow-completion-tracking.entity';
import { EscrowCompletionTrackingRepository } from './escrow-completion-tracking.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WebhookIncomingEntity,
      WebhookOutgoingEntity,
      EscrowCompletionTrackingEntity,
    ]),
    ConfigModule,
    Web3Module,
    HttpModule,
  ],
  controllers: [WebhookController],
  providers: [
    Logger,
    WebhookService,
    WebhookIncomingRepository,
    WebhookOutgoingRepository,
    EscrowCompletionTrackingRepository,
  ],
  exports: [WebhookService],
})
export class WebhookModule {}
