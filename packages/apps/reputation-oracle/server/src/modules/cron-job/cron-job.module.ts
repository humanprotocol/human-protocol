import { Module } from '@nestjs/common';

import { EscrowCompletionModule } from '../escrow-completion/escrow-completion.module';
import { IncomingWebhookModule } from '../webhook/webhook-incoming.module';
import { OutgoingWebhookModule } from '../webhook/webhook-outgoing.module';

import { CronJobService } from './cron-job.service';
import { CronJobRepository } from './cron-job.repository';
import { AbuseModule } from '../abuse/abuse.module';

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
