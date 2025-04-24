import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';

import { EscrowCompletionModule } from '../escrow-completion/escrow-completion.module';

import { WebhookController } from './webhook.controller';
import { IncomingWebhookRepository } from './webhook-incoming.repository';
import { IncomingWebhookService } from './webhook-incoming.service';

@Module({
  imports: [HttpModule, EscrowCompletionModule],
  controllers: [WebhookController],
  providers: [IncomingWebhookService, IncomingWebhookRepository],
  exports: [IncomingWebhookService],
})
export class IncomingWebhookModule {}
