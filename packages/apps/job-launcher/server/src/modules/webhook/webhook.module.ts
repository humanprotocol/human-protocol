import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { WebhookService } from './webhook.service';
import { WebhookEntity } from './webhook.entity';
import { WebhookRepository } from './webhook.repository';
import { Web3Module } from '../web3/web3.module';
import { HttpModule } from '@nestjs/axios';
import { JobModule } from '../job/job.module';
import { WebhookController } from './webhook.controller';
import { JobEntity } from '../job/job.entity';
import { JobRepository } from '../job/job.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookEntity, JobEntity]),
    ConfigModule,
    JobModule,
    Web3Module,
    HttpModule,
    JobModule,
  ],
  controllers: [WebhookController],
  providers: [Logger, WebhookService, WebhookRepository, JobRepository],
  exports: [WebhookService],
})
export class WebhookModule {}
