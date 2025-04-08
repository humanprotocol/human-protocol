import { Module } from '@nestjs/common';

import { EscrowCompletionModule } from '../escrow-completion/escrow-completion.module';
import { WebhookIncomingModule } from '../webhook/webhook-incoming.module';
import { WebhookOutgoingModule } from '../webhook/webhook-outgoing.module';

import { CronJobService } from './cron-job.service';
import { CronJobRepository } from './cron-job.repository';
import { AbuseModule } from '../abuse/abuse.module';

@Module({
  imports: [
    WebhookIncomingModule,
    WebhookOutgoingModule,
    EscrowCompletionModule,
    AbuseModule,
  ],
  providers: [CronJobService, CronJobRepository],
})
export class CronJobModule {}
