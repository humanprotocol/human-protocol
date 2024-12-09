import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HttpModule } from '@nestjs/axios';
import { Web3Module } from '../web3/web3.module';
import { WebhookController } from './webhook.controller';
import { WebhookIncomingEntity } from './webhook-incoming.entity';
import { WebhookIncomingRepository } from './webhook-incoming.repository';
import { EscrowCompletionModule } from '../escrow-completion/escrow-completion.module';
import { WebhookIncomingService } from './webhook-incoming.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookIncomingEntity]),
    ConfigModule,
    Web3Module,
    HttpModule,
    EscrowCompletionModule,
  ],
  controllers: [WebhookController],
  providers: [Logger, WebhookIncomingService, WebhookIncomingRepository],
  exports: [WebhookIncomingService],
})
export class WebhookIncomingModule {}
