import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HttpModule } from '@nestjs/axios';
import { Web3Module } from '../web3/web3.module';
import { WebhookController } from './webhook.controller';
import { WebhookIncomingRepository } from './webhook-incoming.repository';
import { EscrowCompletionModule } from '../escrow-completion/escrow-completion.module';
import { WebhookIncomingService } from './webhook-incoming.service';

@Module({
  imports: [ConfigModule, Web3Module, HttpModule, EscrowCompletionModule],
  controllers: [WebhookController],
  providers: [WebhookIncomingService, WebhookIncomingRepository],
  exports: [WebhookIncomingService],
})
export class WebhookIncomingModule {}
