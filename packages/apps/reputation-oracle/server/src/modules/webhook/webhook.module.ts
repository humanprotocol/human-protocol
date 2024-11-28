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

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookIncomingEntity, WebhookOutgoingEntity]),
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
  ],
  exports: [WebhookService],
})
export class WebhookModule {}
