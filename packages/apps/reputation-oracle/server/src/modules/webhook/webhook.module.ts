import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { WebhookService } from './webhook.service';
import { WebhookIncomingEntity } from './webhook-incoming.entity';
import { WebhookController } from './webhook.controller';
import { WebhookCron } from './webhook.cron';
import { WebhookRepository } from './webhook.repository';
import { ReputationModule } from '../reputation/reputation.module';
import { Web3Module } from '../web3/web3.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookIncomingEntity]),
    ConfigModule,
    ReputationModule,
    Web3Module,
  ],
  controllers: [WebhookController],
  providers: [Logger, WebhookService, WebhookRepository, WebhookCron],
  exports: [WebhookService],
})
export class WebhookModule {}
