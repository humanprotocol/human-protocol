import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { EscrowCompletionModule } from '@/modules/escrow-completion';

import { IncomingWebhookRepository } from './webhook-incoming.repository';
import { IncomingWebhookService } from './webhook-incoming.service';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [HttpModule, EscrowCompletionModule],
  controllers: [WebhookController],
  providers: [IncomingWebhookService, IncomingWebhookRepository],
  exports: [IncomingWebhookService],
})
export class IncomingWebhookModule {}
