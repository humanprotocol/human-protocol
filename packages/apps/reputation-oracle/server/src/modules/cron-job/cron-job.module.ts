import { Module } from '@nestjs/common';

import { AbuseModule } from '../abuse';
import { EscrowCompletionModule } from '../escrow-completion';
import { IncomingWebhookModule, OutgoingWebhookModule } from '../webhook';

import { CronJobService } from './cron-job.service';
import { CronJobRepository } from './cron-job.repository';

@Module({
  imports: [
    IncomingWebhookModule,
    OutgoingWebhookModule,
    EscrowCompletionModule,
    AbuseModule,
  ],
  providers: [CronJobService, CronJobRepository],
})
export class CronJobModule {}
