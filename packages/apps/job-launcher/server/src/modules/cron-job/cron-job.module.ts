import { Global, Module } from '@nestjs/common';

import { CronJobService } from './cron-job.service';
import { CronJobRepository } from './cron-job.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CronJobEntity } from './cron-job.entity';
import { CronJobController } from './cron.job.controller';
import { PaymentModule } from '../payment/payment.module';
import { Web3Module } from '../web3/web3.module';
import { WebhookModule } from '../webhook/webhook.module';
import { JobModule } from '../job/job.module';
import { WebhookRepository } from '../webhook/webhook.repository';
import { JobEntity } from '../job/job.entity';
import { JobRepository } from '../job/job.repository';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([CronJobEntity, JobEntity]),
    ConfigModule,
    JobModule,
    PaymentModule,
    Web3Module,
    WebhookModule,
    ConfigModule,
  ],
  providers: [
    CronJobService,
    CronJobRepository,
    WebhookRepository,
    JobRepository,
  ],
  // controllers: [CronJobController], Commented to disable endpoints
  exports: [CronJobService],
})
export class CronJobModule {}
