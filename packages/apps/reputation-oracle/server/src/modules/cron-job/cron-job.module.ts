import { Global, Module } from '@nestjs/common';

import { CronJobService } from './cron-job.service';
import { CronJobRepository } from './cron-job.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CronJobEntity } from './cron-job.entity';
import { WebhookModule } from '../webhook/webhook.module';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([CronJobEntity]),
    ConfigModule,
    WebhookModule,
  ],
  providers: [CronJobService, CronJobRepository],
  exports: [CronJobService],
})
export class CronJobModule {}
