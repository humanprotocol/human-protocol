import { Global, Module } from '@nestjs/common';

import { CronJobService } from './cron-job.service';
import { CronJobRepository } from './cron-job.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CronJobEntity } from './cron-job.entity';
import { Web3Module } from '../web3/web3.module';
import { WebhookModule } from '../webhook/webhook.module';
import { WebhookRepository } from '../webhook/webhook.repository';
import { ConfigModule } from '@nestjs/config';
import { PayoutModule } from '../payout/payout.module';
import { ReputationModule } from '../reputation/reputation.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([CronJobEntity]),
    ConfigModule,
    Web3Module,
    WebhookModule,
    PayoutModule,
    ReputationModule,
  ],
  providers: [CronJobService, CronJobRepository, WebhookRepository],
  exports: [CronJobService],
})
export class CronJobModule {}
