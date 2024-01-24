import { Global, Module } from '@nestjs/common';

import { CronJobService } from './cron-job.service';
import { CronJobRepository } from './cron-job.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CronJobEntity } from './cron-job.entity';
import { CronJobController } from './cron.job.controller';
import { PaymentModule } from '../payment/payment.module';
import { Web3Module } from '../web3/web3.module';
import { StorageModule } from '../storage/storage.module';
import { WebhookModule } from '../webhook/webhook.module';
import { JobModule } from '../job/job.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([CronJobEntity]),
    JobModule,
    PaymentModule,
    Web3Module,
    StorageModule,
    WebhookModule,
  ],
  providers: [CronJobService, CronJobRepository],
  controllers: [CronJobController],
  exports: [CronJobService],
})
export class CronJobModule {}
