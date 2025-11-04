import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { HttpModule } from '@nestjs/axios';
import { JobEntity } from '../job/job.entity';
import { JobModule } from '../job/job.module';
import { JobRepository } from '../job/job.repository';
import { WebhookController } from './webhook.controller';
import { WebhookEntity } from './webhook.entity';
import { WebhookRepository } from './webhook.repository';
import { WebhookService } from './webhook.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookEntity, JobEntity]),
    ConfigModule,
    JobModule,
    HttpModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService, WebhookRepository, JobRepository],
  exports: [WebhookService],
})
export class WebhookModule {}
