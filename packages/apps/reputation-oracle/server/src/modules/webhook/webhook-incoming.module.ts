import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { WebhookController } from './webhook.controller';
import { WebhookIncomingRepository } from './webhook-incoming.repository';
import { EscrowCompletionModule } from '../escrow-completion/escrow-completion.module';
import { WebhookIncomingService } from './webhook-incoming.service';

@Module({
  imports: [ConfigModule, HttpModule, EscrowCompletionModule],
  controllers: [WebhookController],
  providers: [WebhookIncomingService, WebhookIncomingRepository],
  exports: [WebhookIncomingService],
})
export class WebhookIncomingModule {}
