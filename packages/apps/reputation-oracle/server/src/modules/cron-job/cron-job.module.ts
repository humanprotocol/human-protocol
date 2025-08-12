import { Module } from '@nestjs/common';

import { AbuseModule } from '@/modules/abuse';
import { AuthModule } from '@/modules/auth';
import { EscrowCompletionModule } from '@/modules/escrow-completion';
import {
  IncomingWebhookModule,
  OutgoingWebhookModule,
} from '@/modules/webhook';

import { CronJobService } from './cron-job.service';
import { CronJobRepository } from './cron-job.repository';

@Module({
  imports: [
    IncomingWebhookModule,
    OutgoingWebhookModule,
    EscrowCompletionModule,
    AbuseModule,
    AuthModule,
  ],
  providers: [CronJobService, CronJobRepository],
})
export class CronJobModule {}
