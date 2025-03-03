import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { EscrowCompletionModule } from '../escrow-completion/escrow-completion.module';

import { WebhookController } from './webhook.controller';
import { WebhookIncomingRepository } from './webhook-incoming.repository';
import { WebhookIncomingService } from './webhook-incoming.service';

@Module({
  imports: [HttpModule, EscrowCompletionModule],
  controllers: [WebhookController],
  providers: [WebhookIncomingService, WebhookIncomingRepository],
  exports: [WebhookIncomingService],
})
export class WebhookIncomingModule {}
