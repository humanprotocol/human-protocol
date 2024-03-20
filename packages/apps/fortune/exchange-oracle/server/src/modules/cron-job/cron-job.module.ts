import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookModule } from '../webhook/webhook.module';
import { WebhookRepository } from '../webhook/webhook.repository';
import { CronJobEntity } from './cron-job.entity';
import { CronJobRepository } from './cron-job.repository';
import { CronJobService } from './cron-job.service';
import { CronJobController } from './cron.job.controller';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([CronJobEntity]),
    WebhookModule,
    ConfigModule,
  ],
  providers: [CronJobService, CronJobRepository, WebhookRepository],
  controllers: [CronJobController],
  exports: [CronJobService],
})
export class CronJobModule {}
