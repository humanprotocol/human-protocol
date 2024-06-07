import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { JobModule } from '../job/job.module';
import { WebhookRepository } from './webhook.repository';
import { WebhookEntity } from './webhook.entity';
import { HttpModule } from '@nestjs/axios';
import { Web3Module } from '../web3/web3.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookEntity]),
    JobModule,
    Web3Module,
    ConfigModule,
    HttpModule,
    StorageModule,
  ],
  controllers: [WebhookController],
  providers: [Logger, WebhookService, WebhookRepository],
  exports: [WebhookService],
})
export class WebhookModule {}
